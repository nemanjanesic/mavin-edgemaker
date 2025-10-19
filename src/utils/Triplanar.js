export function useTriplanarProjection(material) {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.sharpness = { value: 4.0 }; // higher = crisper transitions

    shader.vertexShader = `
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        ${shader.vertexShader}
      `
      .replace(
        "#include <begin_vertex>",
        `
        #include <begin_vertex>
        vec4 wp4 = modelMatrix * vec4(position, 1.0);
        vWorldPosition = wp4.xyz;
      `
      )
      .replace(
        "#include <beginnormal_vertex>",
        `
        #include <beginnormal_vertex>
        mat3 wnm = transpose(inverse(mat3(modelMatrix)));
        vWorldNormal = normalize(wnm * normal);
      `
      );

    shader.fragmentShader = `
        uniform float sharpness;
        varying vec3 vWorldPosition;
        varying vec3 vWorldNormal;
        ${shader.fragmentShader}
      `.replace(
      "#include <map_fragment>",
      `
        #ifdef USE_MAP
          vec3 n  = normalize(vWorldNormal);
          vec3 an = abs(n);
          vec3 w  = pow(an, vec3(sharpness));
          w /= (w.x + w.y + w.z + 1e-6);
    
          vec2 uvX = vWorldPosition.yz; // project along X
          vec2 uvY = vWorldPosition.xz; // along Y
          vec2 uvZ = vWorldPosition.xy; // along Z
    
          vec4 cx = texture2D(map, uvX);
          vec4 cy = texture2D(map, uvY);
          vec4 cz = texture2D(map, uvZ);
    
          vec4 tri = cx * w.x + cy * w.y + cz * w.z;
          diffuseColor *= tri;

        #endif
      `
    );
    material.needsUpdate = true;
  };
}
