handleTableMorph() {
    this.boxHelpers.clear();

    // this.createMorphGui();
    if (
      this.selectedModelData.availableLeafOptions &&
      !this.selectedLeafOption
    ) {
      this.selectedLeafOption = this.selectedModelData.availableLeafOptions[0];
    }
    let morphMeshes = [];

    this.model.traverse((child) => {
      if (child.geometry && child.morphTargetInfluences) {
        morphMeshes.push(child);

        //TODO: Delete after optimisation
        //PRIKAZ BOUNDING BOX-eva MESHEVA SA SHAPE KEY
        // let helper = new Box3Helper(new Box3().setFromObject(child), "red");
        // this.boxHelpers.add(helper);
        // if (child.material.map) {
        //   console.log(child.name);
        // }
      }
    });

    for (const mesh of morphMeshes) {
      if (mesh.material.map) mesh.material.map = mesh.material.map.clone();

      mesh.updateMorphTargets();
      switch (true) {
        //TODO: This had to be changed for C-Arc Table
        case mesh.name.includes("TOP") ||
          mesh.name.includes("BREADBOARD") ||
          mesh.name.includes("Top"):
          let shapeKeyValues = this.selectedLeafOption.shapeKeys.find(
            (shapeKey) => shapeKey.meshName.includes("TOP")
          );

          if (shapeKeyValues) {
            mesh.visible = shapeKeyValues.meshVisibility;

            if (this.osloBaseOnly && mesh.material.name === "main") {
              mesh.visible = false;
            }

            // if (mesh.name.includes("SKIRT")) {
            //   mesh.visible =
            //     this.selectedSkirtOption.visible &&
            //     mesh.name.includes(this.selectedEdgeType.edgeTypeSuffix);
            // }
          }

          // console.log(
          //   this.getShapeKeyValue(
          //     this.selectedTableDimensions.width,
          //     this.selectedModelData.tableDimensionsLimitations[0].minValue,
          //     this.selectedModelData.tableDimensionsLimitations[0].maxValue
          //   ),
          //   "width"
          // );

          // console.log(
          //   this.getShapeKeyValue(
          //     this.selectedTableDimensions.depth,
          //     this.selectedModelData.tableDimensionsLimitations[1].minValue,
          //     this.selectedModelData.tableDimensionsLimitations[1].maxValue
          //   ),
          //   "depth"
          // );

          for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
            Object.keys(mesh.morphTargetDictionary).forEach((key) => {
              if (shapeKeyValues.meshShapeKeys[i]) {
                if (i == 0) {
                  mesh.morphTargetInfluences[i] =
                    shapeKeyValues.meshShapeKeys[i].value > 0
                      ? this.selectedModelData.sku === "G-Boat_Table"
                        ? 1 -
                          this.getShapeKeyValue(
                            this.selectedTableDimensions.width,
                            this.selectedModelData.tableDimensionsLimitations[0]
                              .minValue,
                            this.selectedModelData.tableDimensionsLimitations[0]
                              .maxValue
                          )
                        : this.getShapeKeyValue(
                            this.selectedTableDimensions.width,
                            this.selectedModelData.tableDimensionsLimitations[0]
                              .minValue,
                            this.selectedModelData.tableDimensionsLimitations[0]
                              .maxValue
                          ) -
                          this.getShapeKeyValue(
                            this.selectedTableDimensions.width,
                            this.selectedModelData.tableDimensionsLimitations[0]
                              .minValue,
                            this.selectedModelData.tableDimensionsLimitations[0]
                              .maxValue
                          ) *
                            0.2
                      : shapeKeyValues.meshShapeKeys[i].value;
                } else if (i === 1) {
                  mesh.morphTargetInfluences[i] =
                    shapeKeyValues.meshShapeKeys[i].value > 0
                      ? this.selectedModelData.sku === "G-Boat_Table"
                        ? 1 -
                          this.getShapeKeyValue(
                            this.selectedTableDimensions.depth,
                            this.selectedModelData.tableDimensionsLimitations[1]
                              .minValue,
                            this.selectedModelData.tableDimensionsLimitations[1]
                              .maxValue
                          )
                        : this.getShapeKeyValue(
                            this.selectedTableDimensions.depth,
                            this.selectedModelData.tableDimensionsLimitations[1]
                              .minValue,
                            this.selectedModelData.tableDimensionsLimitations[1]
                              .maxValue
                          )
                      : shapeKeyValues.meshShapeKeys[i].value;
                } else {
                  mesh.morphTargetInfluences[i] =
                    shapeKeyValues.meshShapeKeys[i].value;
                }
              }
            });
          }
          break;

        //TODO: Remove mesh.name LEAF_12, left for compatibility with current C-Arc Table
        case mesh.name === "LEAF_12":
        case mesh.name.includes("LEAF_12-18"):
          let shapeKeyValues12to18 = this.selectedLeafOption.shapeKeys.find(
            (shapeKey) =>
              shapeKey.meshName.includes("LEAF_12") ||
              shapeKey.meshName.includes("LEAF_12-18")
          );

          if (shapeKeyValues12to18) {
            mesh.visible = shapeKeyValues12to18.meshVisibility;
          }

          for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
            Object.keys(mesh.morphTargetDictionary).forEach((key) => {
              if (i == 0) {
                mesh.morphTargetInfluences[i] =
                  shapeKeyValues12to18.meshShapeKeys[i].value;
              } else {
                if (
                  this.selectedModelData.sku === "B-Oval-Round_Table" ||
                  this.selectedModelData.sku === "G-Boat_Table" ||
                  this.selectedModelData.sku === "L-Neo_Table" ||
                  this.selectedModelData.sku === "B-Oslo_Table"
                ) {
                  mesh.morphTargetInfluences[i] = this.getShapeKeyValue(
                    this.selectedTableDimensions.depth,
                    36,
                    72
                  );
                } else {
                  mesh.morphTargetInfluences[i] = this.getShapeKeyValue(
                    this.selectedTableDimensions.depth,
                    this.selectedModelData.tableDimensionsLimitations[1]
                      .minValue,
                    this.selectedModelData.tableDimensionsLimitations[1]
                      .maxValue
                  );
                }
              }
            });
          }

          break;

        case mesh.name.includes("LEAF_24"):
          let shapeKeyValues24 = this.selectedLeafOption.shapeKeys.find(
            (shapeKey) => shapeKey.meshName.includes("LEAF_24")
          );

          if (shapeKeyValues24) {
            mesh.visible = shapeKeyValues24.meshVisibility;
            // if (mesh.name.includes("_SKIRT"))
            //   mesh.visible =
            //     shapeKeyValues24.meshVisibility &&
            //     this.selectedSkirtOption.visible &&
            //     mesh.name.includes(this.selectedEdgeType.edgeTypeSuffix);
          }

          for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
            Object.keys(mesh.morphTargetDictionary).forEach((key) => {
              if (
                this.selectedModelData.sku === "B-Oval-Round_Table" ||
                this.selectedModelData.sku === "G-Boat_Table" ||
                this.selectedModelData.sku === "L-Neo_Table" ||
                this.selectedModelData.sku === "B-Oslo_Table"
              ) {
                mesh.morphTargetInfluences[i] = this.getShapeKeyValue(
                  this.selectedTableDimensions.depth,
                  36,
                  72
                );
              } else
                mesh.morphTargetInfluences[i] = this.getShapeKeyValue(
                  this.selectedTableDimensions.depth,
                  this.selectedModelData.tableDimensionsLimitations[1].minValue,
                  this.selectedModelData.tableDimensionsLimitations[1].maxValue
                );
            });
          }

          break;
      }

      // //RACUNICA

      let minWidthValue =
        this.selectedModelData.tableDimensionsLimitations[1].minValue;
      let maxWidthValue =
        this.selectedModelData.tableDimensionsLimitations[1].maxValue;

      let min = 1,
        maxWTableTop = (maxWidthValue / minWidthValue) * this.TABLE_TOP_ABD_L,
        maxLTableTop = (maxWidthValue / minWidthValue) * this.TABLE_TOP_ABD_W;

      let d = this.getShapeKeyValue(
        this.selectedTableDimensions.depth,
        minWidthValue,
        maxWidthValue
      );
      let w = this.getShapeKeyValue(
        this.selectedTableDimensions.width,
        minWidthValue,
        maxWidthValue
      );

      let widthRepeat =
        this.selectedTableDimensions.width /
        this.selectedModelData.tableDimensionsLimitations[0].minValue;
      let depthRepeat =
        this.selectedTableDimensions.depth /
        this.selectedModelData.tableDimensionsLimitations[1].minValue;

      //TODO: Dodeljivanje Textura za materijale koji imaju u sebi main-top a nema ih u

      // if (
      //   !this.materials.find((x) => x.name === mesh.material.name) &&
      //   mesh.material.name.includes("main_top_")
      // ) {
      //   // console.log(mainTopMat);

      //   let map = mainTopMat.map;

      //   // console.log(map);

      //   mesh.material.map = mainTopMat.map;
      //   mesh.material.normalMap = mainTopMat.normalMap;
      //   mesh.material.roughnessMap = mainTopMat.roughnessMap;
      //   // console.log(mesh.material);
      // }

      if (
        this.selectedModelData.sku !== "B-Oval-Round_Table" &&
        this.selectedModelData.sku !== "L-Neo_Table" &&
        this.selectedModelData.sku !== "G-Boat_Table" &&
        this.selectedModelData.sku !== "B-Oslo_Table"
      ) {
        if (mesh.material.map) {
          mesh.material.map.offset = new Vector2(0, 0);
          mesh.material.map.repeat = new Vector2(1, 1);

          if (
            !mesh.name.includes("BREADBOARD") ||
            !mesh.name.includes("leaf") ||
            !mesh.name.includes("LEAF")
          ) {
            mesh.material.map.repeat.x = widthRepeat;
            mesh.material.map.repeat.y = depthRepeat;

            // mesh.material.map.offset.x = (-d * (widthRepeat - min)) / 2;
            // mesh.material.map.offset.y = (-w * (depthRepeat - min)) / 2;

            mesh.material.map.offset.y = (-d * (widthRepeat - min)) / 2;
            mesh.material.map.offset.x = (-w * (depthRepeat - min)) / 2;

            if (mesh.name.includes("BREADBOARD")) {
              mesh.visible = this.selectedBreadboardOption.visible;
            }

            if (this.selectedLeafOption.name !== "Solid") {
              //rotateGrainTextureDirection
              if (
                [
                  "K-Cosmo_Table",
                  "SSA-Sydney-Storage_Table",
                  "A-Rectangular_Table",
                  "F-Concave_Table",
                  "E-Polo_Table",
                  "PA-Rectangular-Plank_Table",
                ].includes(this.selectedModelData.sku)
              ) {
                //rotateGrainTextureDirection
                mesh.material = mesh.material.clone();

                if (mesh.material.name !== "main") {
                  mesh.material.map.rotation =
                    mesh.name.includes("right") &&
                    this.selectedModelData.sku !== "A-Rectangular_Table"
                      ? -Math.PI / 2
                      : Math.PI / 2;
                }
                mesh.material.map.repeat.x = depthRepeat;
                mesh.material.map.repeat.y = widthRepeat;
              }
            } else {
              if (
                [
                  "K-Cosmo_Table",
                  "BL-Boulder_Table",
                  "A-Rectangular_Table",
                  "F-Concave_Table",
                  "E-Polo_Table",
                  "PA-Rectangular-Plank_Table",
                ].includes(this.selectedModelData.sku)
              ) {
                if (
                  (this.selectedTableDimensions.name === "48x36" &&
                    this.selectedModelData.sku !== "BL-Boulder_Table") ||
                  this.selectedTableDimensions.name === "60x42"
                ) {
                  mesh.material = mesh.material.clone();
                  mesh.material.map.rotation = mesh.name.includes("right")
                    ? Math.PI / 2
                    : -Math.PI / 2;
                  mesh.material.map.repeat.x = depthRepeat;
                  mesh.material.map.repeat.y = widthRepeat;
                } else {
                  mesh.material.map.rotation = 0;
                }
              }

              if (
                this.selectedModelData.sku === "A-Rectangular_Table" &&
                this.sydneyStorageTable
              ) {
                if (mesh.material.name === "main_top") {
                  if (
                    this.selectedTableDimensions.width ===
                    this.selectedTableDimensions.depth
                  ) {
                    mesh.material.map.rotation = 0;
                  } else {
                    mesh.material.map.rotation = Math.PI / 2;
                  }
                  mesh.material.needsUpdate = true;
                }
              }
            }

            // if (mesh.name.includes("LEAF")) {
            //   // console.log(mesh.name);
            //   // console.log("ovde je");
            //   mesh.material.map = mesh.material.map.clone();

            //   mesh.material.map.repeat.y = 5;
            //   mesh.material.map.repeat.x = 5;
            //   mesh.material.map.offset.x = (-w * (depthRepeat - min)) / 2;

            //   // console.log(mesh.material.name, mesh.material.map);
            // }
          }

          if (
            (mesh.name.includes("leaf") || mesh.name.includes("LEAF")) &&
            mesh.material.name === "main_top"
          ) {
            if (
              mesh.name.includes(
                `${this.selectedEdgeType.edgeTypeSuffix}_LEAF_12-18`
              ) ||
              mesh.name.includes(
                `${this.selectedEdgeType.edgeTypeSuffix}_LEAF_12-18_SKIRT`
              )
            ) {
              mesh.material.map.rotation = 0;
              switch (this.selectedLeafOption.name) {
                case "1-18 Leaf":
                  mesh.material = mesh.material.clone();
                  mesh.material.map.repeat.y = 1.6;
                  mesh.material.map.repeat.x = 2 - (1 - d);
                  // mesh.material.map.offset.y = 0;
                  // mesh.material.map.offset.x = d * 0.417;

                  mesh.material.map.offset.x = (-d * (widthRepeat - min)) / 2;
                  mesh.material.map.offset.y = -0.5;
                  mesh.material.map.rotation = 0;

                  mesh.material.needsUpdate = true;
                  break;

                default:
                  mesh.material = mesh.material.clone();
                  mesh.material.map.repeat.x = 2 - (1 - d);
                  mesh.material.map.offset.x = d * 0.417;
                  mesh.material.map.repeat.y = 1;
                  mesh.material.map.offset.y = 0;
                  mesh.material.map.rotation = 0;
                  mesh.material.needsUpdate = true;

                  break;
              }
            }

            if (mesh.name.includes("24")) {
              switch (this.selectedLeafOption.name) {
                case "2-12 Leaves":
                  mesh.material = mesh.material.clone();
                  mesh.material.map.repeat.x = 1;
                  mesh.material.map.offset.x = 0;
                  mesh.material.map.repeat.y = 1;
                  mesh.material.map.offset.y = 0;
                  mesh.material.map.rotation = 0;
                  mesh.material.needsUpdate = true;
                  break;
              }
            }

            // mesh.material.map.repeat.x = 20;

            if (this.selectedModelData.sku === "PA-Rectangular-Plank_Table") {
              mesh.material = mesh.material.clone();
              // mesh.material.map.rotation = Math.PI/2;
            }
          }

          // console.log(mesh.name, mesh.material.name, mesh.material.map.repeat);
        } else {
          if (mesh.material && mesh.material.map) {
            mesh.material = mesh.material.clone();
            mesh.material.map.rotation = 0.5;
          }
          if (
            (mesh.name.includes("leaf") || mesh.name.includes("LEAF")) &&
            mesh.material.name === "main_top"
          ) {
            mesh.material.map.offset = new Vector2(0, 0);
            mesh.material.map.repeat = new Vector2(1, 1);

            if (
              mesh.name.includes(
                `${this.selectedEdgeType.edgeTypeSuffix}_LEAF_12-18`
              )
            ) {
              switch (this.selectedLeafOption.name) {
                case "1-18 Leaf":
                  mesh.material = mesh.material.clone();
                  mesh.material.map.repeat.y = 1.6;
                  mesh.material.map.repeat.x = 2 - (1 - d);
                  // mesh.material.map.offset.y = 0;

                  mesh.material.map.offset.x = (-d * (widthRepeat - min)) / 2;
                  mesh.material.map.offset.y = -0.5;
                  mesh.material.map.rotation = 0;
                  mesh.material.needsUpdate = true;
                  break;

                default:
                  mesh.material = mesh.material.clone();
                  mesh.material.map.repeat.x = 2 - (1 - d);
                  mesh.material.map.offset.x = d * 0.417;
                  mesh.material.map.repeat.y = 1;
                  mesh.material.map.offset.y = 0;
                  mesh.material.map.rotation = 0;
                  mesh.material.needsUpdate = true;

                  break;
              }
            }

            if (mesh.name.includes("24")) {
              switch (this.selectedLeafOption.name) {
                case "2-12 Leaves":
                  mesh.material = mesh.material.clone();
                  mesh.material.map.repeat.x = 1;
                  mesh.material.map.offset.x = 0;
                  mesh.material.map.repeat.y = 1;
                  mesh.material.map.offset.y = 0;
                  mesh.material.map.rotation = 0;
                  mesh.material.needsUpdate = true;
                  break;
              }
            }

            // mesh.material.map.repeat.x = 20;
          } else {
          }
        }

        if (
          this.selectedModelData.sku === "C-Arc_Table" &&
          mesh.material.name === "main_top"
        ) {
          useTriplanarProjection(mesh.material);
        }

        mesh.material.needsUpdate = true;
      }

      // console.log(mesh.name, mesh.material.map.offset, "Offset na kraju svega");
    }

    // CHANGE LEAF ROTATION
    if (this.selectedLeafOption.name !== "Solid") {
      this.model.traverse((m) => {
        if (m.isMesh && m.name.includes("EA_TOP")) {
          m.material = m.material.clone();
          m.material.map.rotation = m.name.includes("right")
            ? Math.PI / 2
            : -Math.PI / 2;
          m.material.needsUpdate = true;
        }

        if (m.isMesh && m.name.includes("EA_LEAF")) {
          m.material = m.material.clone();
          m.material.map.rotation = 0;
          m.material.needsUpdate = true;
        }
      });
    }

    this.model.traverse((x) => {
      if (x.name.includes("curve")) {
        x.visible = false;
      }
    });

    this.updateLegs();
  }