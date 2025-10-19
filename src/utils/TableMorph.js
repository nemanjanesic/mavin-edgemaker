const TABLE_TOP_ABD_W = 1.18;
const TABLE_TOP_ABD_L = 1.12;

export function handleTableMorph(model, data, dimensions, leafOption = null) {
  if (data.availableLeafOptions && !leafOption) {
    leafOption = data.availableLeafOptions[0];
  }

  let morphMeshes = [];

  model.traverse((child) => {
    if (child.geometry && child.morphTargetInfluences) {
      morphMeshes.push(child);
    }
  });

  for (const mesh of morphMeshes) {
    mesh.updateMorphTargets();
    switch (true) {
      case mesh.name.includes("Top") || mesh.name.includes("BREADBOARD"):
        let shapeKeyValues = leafOption.shapeKeys.find((shapeKey) =>
          shapeKey.meshName.includes("TOP")
        );

        if (shapeKeyValues) {
          mesh.visible = shapeKeyValues.meshVisibility;
        }

        for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
          Object.keys(mesh.morphTargetDictionary).forEach((key) => {
            if (shapeKeyValues.meshShapeKeys[i]) {
              if (i == 0) {
                mesh.morphTargetInfluences[i] =
                  shapeKeyValues.meshShapeKeys[i].value > 0
                    ? data.sku === "G-Boat_Table"
                      ? 1 -
                        getShapeKeyValue(
                          dimensions.width,
                          data.tableDimensionsLimitations[0].minValue,
                          data.tableDimensionsLimitations[0].maxValue
                        )
                      : getShapeKeyValue(
                          dimensions.width,
                          data.tableDimensionsLimitations[0].minValue,
                          data.tableDimensionsLimitations[0].maxValue
                        ) -
                        getShapeKeyValue(
                          dimensions.width,
                          data.tableDimensionsLimitations[0].minValue,
                          data.tableDimensionsLimitations[0].maxValue
                        ) *
                          0.2
                    : shapeKeyValues.meshShapeKeys[i].value;
              } else if (i === 1) {
                mesh.morphTargetInfluences[i] =
                  shapeKeyValues.meshShapeKeys[i].value > 0
                    ? data.sku === "G-Boat_Table"
                      ? 1 -
                        getShapeKeyValue(
                          dimensions.depth,
                          data.tableDimensionsLimitations[1].minValue,
                          data.tableDimensionsLimitations[1].maxValue
                        )
                      : getShapeKeyValue(
                          dimensions.depth,
                          data.tableDimensionsLimitations[1].minValue,
                          data.tableDimensionsLimitations[1].maxValue
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

      case mesh.name.includes("LEAF_12"):
        let shapeKeyValues12to18 = leafOption.shapeKeys.find((shapeKey) =>
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
                data.sku === "B-Oval-Round_Table" ||
                data.sku === "G-Boat_Table" ||
                data.sku === "L-Neo_Table" ||
                data.sku === "B-Oslo_Table"
              ) {
                mesh.morphTargetInfluences[i] = getShapeKeyValue(
                  dimensions.depth,
                  36,
                  72
                );
              } else {
                mesh.morphTargetInfluences[i] = getShapeKeyValue(
                  dimensions.depth,
                  data.tableDimensionsLimitations[1].minValue,
                  data.tableDimensionsLimitations[1].maxValue
                );
              }
            }
          });
        }

        break;

      case mesh.name.includes("LEAF_24"):
        let shapeKeyValues24 = leafOption.shapeKeys.find((shapeKey) =>
          shapeKey.meshName.includes("LEAF_24")
        );

        if (shapeKeyValues24) {
          mesh.visible = shapeKeyValues24.meshVisibility;
        }

        for (let i = 0; i < mesh.morphTargetInfluences.length; i++) {
          Object.keys(mesh.morphTargetDictionary).forEach((key) => {
            if (
              data.sku === "B-Oval-Round_Table" ||
              data.sku === "G-Boat_Table" ||
              data.sku === "L-Neo_Table" ||
              data.sku === "B-Oslo_Table"
            ) {
              mesh.morphTargetInfluences[i] = getShapeKeyValue(
                dimensions.depth,
                36,
                72
              );
            } else
              mesh.morphTargetInfluences[i] = getShapeKeyValue(
                dimensions.depth,
                data.tableDimensionsLimitations[1].minValue,
                data.tableDimensionsLimitations[1].maxValue
              );
          });
        }

        break;
    }

    mesh.geometry.attributes.position.needsUpdate = true;
  }
}

function getShapeKeyValue(value, min, max) {
  let shapeKeyVal = (value - min) / (max - min);

  if (shapeKeyVal < 0) {
    shapeKeyVal = 1 + Math.abs(shapeKeyVal);
  }
  return shapeKeyVal;
}
