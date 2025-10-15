// Plain JS class you can use anywhere (React or not)
import * as THREE from "three";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { sweepProfileAlongPath } from "../utils/Sweep";
import { handleTableMorph } from "../utils/TableMorph";

import { useTriplanarProjection } from "../utils/Triplanar";

export class Player {
  /** @param {HTMLElement} container */
  constructor(container, opts = {}) {
    if (!container) throw new Error("Player: container element is required.");
    this.container = container;
    this.opts = {
      background: opts.background ?? "white",
      fov: opts.fov ?? 45,
      near: opts.near ?? 0.1,
      far: opts.far ?? 1000,
      cameraPos: opts.cameraPos ?? new THREE.Vector3(1.5, 1.5, 1.5),
      enableGrid: opts.enableGrid ?? true,
      dracoPath: opts.dracoPath ?? "/draco/", // put decoder files in /public/draco/
    };

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.opts.background);

    // Camera
    const { clientWidth: w, clientHeight: h } = this.container;
    this.camera = new THREE.PerspectiveCamera(
      this.opts.fov,
      w / h,
      this.opts.near,
      this.opts.far
    );
    this.camera.position.copy(this.opts.cameraPos);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(w, h);
    this.container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // Lights
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.75);
    this.directionalLight.position.set(3, 5, 2);
    this.scene.add(this.directionalLight);
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    this.scene.add(this.ambientLight);

    // Grid (optional)
    if (this.opts.enableGrid) {
      const grid = new THREE.GridHelper(10, 10);
      grid.name = "grid";
      this.scene.add(grid);
    }

    this.model = new THREE.Group();
    this.scene.add(this.model);

    // Loaders
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath(this.opts.dracoPath);
    this.dracoLoader.preload();

    this.gltfLoader = new GLTFLoader();
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Bind animate so we can start/stop
    this._isAnimating = false;
    this._animate = this._animate.bind(this);

    // Resize handling
    this._onResize = this.resize.bind(this);
    window.addEventListener("resize", this._onResize);

    // Start loop
    this.start();
  }

  /** Animation loop */
  _animate(t) {
    // per-frame updates here if needed (t is time in ms)
    this.controls?.update();
    this.renderer.render(this.scene, this.camera);
    if (this._isAnimating)
      this._raf = this.renderer.setAnimationLoop(this._animate);
  }

  start() {
    if (this._isAnimating) return;
    this._isAnimating = true;
    this._raf = this.renderer.setAnimationLoop(this._animate);
  }

  stop() {
    this._isAnimating = false;
    this.renderer.setAnimationLoop(null);
    if (this._raf) cancelAnimationFrame(this._raf);
  }

  /** Clean up GPU/DOM/listeners */
  dispose() {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    this.controls?.dispose();

    // dispose scene objects (materials/geometries)
    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        obj.geometry?.dispose?.();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m?.dispose?.());
        } else {
          obj.material?.dispose?.();
        }
      }
    });

    // remove canvas
    if (this.renderer?.domElement?.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }
    this.renderer?.dispose?.();
  }

  /** Handle container resize */
  resize() {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  /** Simple background setter */
  setBackground(colorOrTexture) {
    if (colorOrTexture instanceof THREE.Texture) {
      this.scene.background = colorOrTexture;
    } else {
      this.scene.background = new THREE.Color(colorOrTexture);
    }
  }

  /** Load a GLTF/GLB, optionally give it a name and auto-add to scene */
  async loadGLTF(url, { name, addToScene = true } = {}) {
    const gltf = await new Promise((resolve, reject) => {
      this.gltfLoader.load(url, resolve, undefined, reject);
    });
    if (name) gltf.scene.name = name;
    if (addToScene) this.model.add(gltf.scene);
    return gltf;
  }

  async loadCurve(curveName = "EA", firstLoad = false) {
    if (firstLoad) {
      await this.loadGLTF("./C-Arc_Table.gltf", { name: "table" });
      await this.loadGLTF(`./edges.gltf`, {
        name: "profile",
      });

      let texture = new THREE.TextureLoader().load("./wood.webp");
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(1, 1);
      texture.colorSpace = THREE.SRGBColorSpace;

      const projectedMaterial = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.5,
        metalness: 0,
      });

      useTriplanarProjection(projectedMaterial);

      this.projectedMaterial = projectedMaterial;
    } else {
      let sweeps = this.model.children.filter((x) => x.name === "sweep");
      sweeps.forEach((s) => s.removeFromParent());
    }

    const profile = this.model.getObjectByName(`${curveName}_profile_CURVE`);

    const data = {
      availableLeafOptions: [
        {
          name: "Solid",
          shapeKeyNameSuffix: ``,
          shapeKeys: [
            {
              meshName: "LEAF_12-18",
              meshVisibility: false,
              meshShapeKeys: [
                {
                  name: "LEAF_width_12-18",
                  value: 0,
                },
                {
                  name: "LEAF_depth_45-96",
                  value: 0,
                },
              ],
            },
            {
              meshName: "LEAF_24",
              meshVisibility: false,
              meshShapeKeys: [
                {
                  name: "LEAF_depth_45-96",
                  value: 1,
                },
              ],
            },
            {
              meshName: "TOP",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "_TOP_A_(width)",
                  value: 1,
                },
                {
                  name: "_TOP_A_(depth)",
                  value: 1,
                },
                {
                  name: "Basis_leaf_12",
                  value: 0,
                },
                {
                  name: "Basis_leaf_18",
                  value: 0,
                },
                {
                  name: "Basis_leaf_24",
                  value: 0,
                },
              ],
            },
          ],
        },
        {
          name: "2-12 Leaves",
          shapeKeyNameSuffix: `LEAF_24`,
          shapeKeyTargetDictionaryName: "Basis_leaf_24",
          shapeKeys: [
            {
              meshName: "LEAF_12-18",
              meshVisibility: false,
              meshShapeKeys: [
                {
                  name: "LEAF_width_12-18",
                  value: 0,
                },
                {
                  name: "LEAF_depth_45-96",
                  value: 1,
                },
              ],
            },
            {
              meshName: "LEAF_24",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "LEAF_depth_45-96",
                  value: 1,
                },
              ],
            },
            {
              meshName: "TOP",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "_TOP_A_(width)",
                  value: 1,
                },
                {
                  name: "_TOP_A_(depth)",
                  value: 1,
                },
                {
                  name: "Basis_leaf_12",
                  value: 0,
                },
                {
                  name: "Basis_leaf_18",
                  value: 0,
                },
                {
                  name: "Basis_leaf_24",
                  value: 1,
                },
              ],
            },
          ],
        },
        {
          name: "1-12 Leaf",
          shapeKeyNameSuffix: `LEAF_12-18`,
          shapeKeys: [
            {
              meshName: "LEAF_12-18",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "LEAF_width_12-18",
                  indexPosition: "0",
                  value: 0,
                },
                {
                  name: "LEAF_depth_45-96",
                  indexPosition: "1",
                  value: 1,
                },
              ],
            },
            {
              meshName: "LEAF_24",
              meshVisibility: false,
              meshShapeKeys: [
                {
                  name: "LEAF_depth_45-96",
                  value: 0,
                },
              ],
            },
            {
              meshName: "TOP",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "_TOP_A_(width)",
                  value: 1,
                },
                {
                  name: "_TOP_A_(depth)",
                  value: 1,
                },
                {
                  name: "Basis_leaf_12",
                  value: 1,
                },
                {
                  name: "Basis_leaf_18",
                  value: 0,
                },
                {
                  name: "Basis_leaf_24",
                  value: 0,
                },
              ],
            },
          ],
        },
        {
          name: "1-18 Leaf",
          shapeKeyNameSuffix: `LEAF_12-18`,
          shapeKeys: [
            {
              meshName: "LEAF_12-18",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "LEAF_width_12-18",
                  value: 1,
                },
                {
                  name: "LEAF_depth_45-96",
                  value: 1,
                },
              ],
            },
            {
              meshName: "LEAF_24",
              meshVisibility: false,
              meshShapeKeys: [
                {
                  name: "LEAF_depth_45-96",
                  value: 0,
                },
              ],
            },
            {
              meshName: "TOP",
              meshVisibility: true,
              meshShapeKeys: [
                {
                  name: "_TOP_A_(width)",
                  value: 1,
                },
                {
                  name: "_TOP_A_(depth)",
                  value: 1,
                },
                {
                  name: "Basis_leaf_12",
                  value: 0,
                },
                {
                  name: "Basis_leaf_18",
                  value: 1,
                },
                {
                  name: "Basis_leaf_24",
                  value: 0,
                },
              ],
            },
          ],
        },
      ],
      tableDimensionsLimitations: [
        { name: "width", minValue: 36, maxValue: 108 },
        { name: "depth", minValue: 36, maxValue: 108 },
      ],
    };

    const dimensions = {
      width: 108,
      depth: 36,
    };

    const edge = this.model.getObjectByName("Top_Left_curve");
    const edge2 = this.model.getObjectByName("Top_RIGHT_curve");

    // handleTableMorph(
    //   this.model,
    //   data,
    //   dimensions,
    //   data.availableLeafOptions[1]
    // );

    edge.scale.set(0.995, 0.995, 0.995);
    edge2.scale.set(0.995, 0.995, 0.995);

    const sweep = sweepProfileAlongPath({
      profileLineObj: profile,
      pathLineObj: edge,
      profilePlane: "YZ",
      flipProfileY: false,
      flipProfileX: true,
      steps: 2000,
      resample: 2000,
      tension: 0.1,
      pathClosed: false,
    });

    const sweep2 = sweepProfileAlongPath({
      profileLineObj: profile,
      pathLineObj: edge2,
      profilePlane: "YZ",
      flipProfileY: false,
      flipProfileX: true,
      steps: 2000,
      resample: 2000,
      tension: 0.1,
      pathClosed: false,
    });

    this.model.getObjectByName("table").traverse((obj) => {
      if (obj.material) {
        obj.material = this.projectedMaterial;
      }
    });

    sweep.material = this.projectedMaterial;
    sweep.name = "sweep";
    sweep2.material = this.projectedMaterial;
    sweep2.name = "sweep";

    this.model.add(sweep, sweep2);

    this.model.traverse((child) => {
      if (child.name.includes("curve") || child.name.includes("LEAF")) {
        child.visible = false;
      }
    });
  }

  getObject(name) {
    return this.scene.getObjectByName(name);
  }

  setCameraPosition(x, y, z) {
    this.camera.position.set(x, y, z);
  }
  lookAt(x, y, z) {
    this.camera.lookAt(x, y, z);
  }

  setGridVisible(visible) {
    const grid = this.getObject("grid");
    if (grid) grid.visible = !!visible;
  }
}
