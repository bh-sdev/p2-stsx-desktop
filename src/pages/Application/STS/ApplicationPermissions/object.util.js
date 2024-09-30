export function updatePermissions(serverData) {
  let allView = true,
    allCreate = true,
    allDelete = true,
    allEdit = true,
    allViewFalse = true,
    allCreateFalse = true,
    allDeleteFalse = true,
    allEditFalse = true,
    allowAllFalse = true;

  function recurse(subObj) {
    for (let key in subObj) {
      if (typeof subObj[key] === 'object' && subObj[key] !== null) {
        if ('View' in subObj[key]) {
          allView = allView && subObj[key].View;
          if (subObj[key].View) {
            allViewFalse = false;
          }
        }
        if ('Create' in subObj[key]) {
          allCreate = allCreate && subObj[key].Create;
          if (subObj[key].Create) {
            allCreateFalse = false;
          }
        }
        if ('Delete' in subObj[key]) {
          allDelete = allDelete && subObj[key].Delete;
          if (subObj[key].Delete) {
            allDeleteFalse = false;
          }
        }
        if ('Edit' in subObj[key]) {
          allEdit = allEdit && subObj[key].Edit;
          if (subObj[key].Edit) {
            allEditFalse = false;
          }
        }
        if ('AllowAll' in subObj[key]) {
          if (subObj[key].AllowAll) {
            allowAllFalse = false;
          }
        }

        recurse(subObj[key]);
      }
    }
  }

  recurse(serverData.Permissions);
  const AllowAll = allView && allDelete && allCreate && allEdit;
  return {
    ...serverData,
    View: allViewFalse ? null : allView,
    Create: allCreateFalse ? null : allCreate,
    Delete: allDeleteFalse ? null : allDelete,
    Edit: allEditFalse ? null : allEdit,
    AllowAll: allowAllFalse ? null : AllowAll,
  };
}

export function replaceDotsWithDashes(obj) {
  const newObj = Array.isArray(obj) ? [] : {};

  Object.keys(obj).forEach((key) => {
    const newKey = key.replace(/\./g, '-');

    if (obj[key] !== null && typeof obj[key] === 'object') {
      newObj[newKey] = replaceDotsWithDashes(obj[key]);

      if (newObj[newKey].Other && typeof newObj[newKey].Other === 'object') {
        Object.assign(newObj[newKey], newObj[newKey].Other);
        if (
          newObj[newKey].View &&
          newObj[newKey].Other.Create &&
          newObj[newKey].Other.Edit &&
          newObj[newKey].Other.Delete
        ) {
          Object.assign(newObj[newKey], { AllowAll: true });
        } else {
          Object.assign(newObj[newKey], { AllowAll: false });
        }
        delete newObj[newKey].Other;
      }
    } else {
      newObj[newKey] = obj[key];
    }
  });

  return newObj;
}
export function setPermissionsFalseAndReturnNew(data) {
  let newData = JSON.parse(JSON.stringify(data));

  function recurseAndSetFalse(obj) {
    for (const key in obj) {
      // eslint-disable-next-line no-prototype-builtins
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        if (typeof value === 'object' && value !== null) {
          if (value['Create'] !== undefined) value['Create'] = false;
          if (value['Delete'] !== undefined) value['Delete'] = false;
          if (value['Edit'] !== undefined) value['Edit'] = false;
          if (value['View'] !== undefined) value['View'] = false;
          if (value['AllowAll'] !== undefined) value['AllowAll'] = false;
          recurseAndSetFalse(value);
        }
      }
    }
  }

  recurseAndSetFalse(newData);
  return newData;
}
export function findObjectsWithCreateKey(obj) {
  const objCopy = JSON.parse(JSON.stringify(obj));
  let result = [];

  function searchObject(currentObj) {
    if (typeof currentObj === 'object' && currentObj !== null) {
      for (let key in currentObj) {
        // eslint-disable-next-line no-prototype-builtins
        if (currentObj.hasOwnProperty(key)) {
          if (key === 'View') {
            if ('AllowAll' in currentObj) {
              delete currentObj['AllowAll'];
            }
            currentObj.Other = {
              ...(currentObj.Create !== undefined && { Create: currentObj.Create }),
              ...(currentObj.Edit !== undefined && { Edit: currentObj.Edit }),
              ...(currentObj.Delete !== undefined && { Delete: currentObj.Delete }),
            };
            delete currentObj.Create;
            delete currentObj.Edit;
            delete currentObj.Delete;
            result.push(currentObj);
            return;
          }

          if (typeof currentObj[key] === 'object') {
            searchObject(currentObj[key]);
          }
        }
      }
    }
  }

  searchObject(objCopy);
  return result;
}
export const compareEntries = (a, b) => {
  let startsWithDotA = a.Name.startsWith('.');
  let startsWithDotB = b.Name.startsWith('.');

  if (startsWithDotA && !startsWithDotB) {
    return -1;
  } else if (!startsWithDotA && startsWithDotB) {
    return 1;
  } else {
    return a.Name.localeCompare(b.Name);
  }
};
export function areAllTrue(obj, key, ignoredPath) {
  let allTrue = true;
  let ignoredPathArray = ignoredPath.split('.');

  function checkNested(obj, currentPath = []) {
    for (let k in obj) {
      let newPath = [...currentPath, k];
      if (ignoredPathArray.join('.') === newPath.join('.')) {
        continue;
      }

      if (typeof obj[k] === 'object' && obj[k] !== null) {
        checkNested(obj[k], newPath);
      } else if (k === key && obj[k] !== undefined) {
        allTrue = allTrue && obj[k] === true;
      }
    }
  }

  checkNested(obj);
  return allTrue;
}

export function areAllFalse(obj, key) {
  if (typeof obj === 'object' && obj !== null) {
    if (!Array.isArray(obj)) {
      if (key in obj && obj[key]) {
        return false;
      }
    }
    for (let prop in obj) {
      if (!areAllFalse(obj[prop], key)) {
        return false;
      }
    }
  }
  return true;
}
