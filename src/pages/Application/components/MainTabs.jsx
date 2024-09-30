import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';

import { TabMenu } from 'primereact/tabmenu';
import { useResizeListener } from 'primereact/hooks';
import { Menu } from 'primereact/menu';

import useActions from 'hooks/useActions';

import { LOCAL_STORAGE_VARIABLES } from 'const';
import useWindowFocus from 'hooks/useWindowFocus';

const getCountBySize = (size) => {
  let count = 8;
  if (size < 450) count = 0;
  else if (size >= 450 && size < 720) count = 1;
  else if (size >= 720 && size < 960) count = 2;
  else if (size >= 960 && size < 1440) count = 3;
  else if (size >= 1440 && size < 1600) count = 4;
  else if (size >= 1600 && size < 1920) count = 5;
  else if (size >= 1920 && size <= 2560) count = 7;
  return count;
};

// const TAB_WIDTH = 256;

const MainTabs = () => {
  const history = useSelector((state) => state.history);
  const { removeHistoryLink, restoreHistoryLinksFromLocalStorage, applicationPermission } =
    useActions();
  const [visibleItems, setVisibleItems] = useState([]);
  const [hiddenItems, setHiddenItems] = useState([]);
  const tabMenuRef = useRef();
  useWindowFocus(applicationPermission);
  const hiddenLinksMenu = useRef();
  const [countOfVisibleLinks, setCountOfVisibleLinks] = useState(6);
  const [bindWindowResizeListener, unbindWindowResizeListener] = useResizeListener({
    listener: (event) => {
      if (getCountBySize(event.currentTarget.innerWidth) !== countOfVisibleLinks)
        setCountOfVisibleLinks(getCountBySize(event.currentTarget.innerWidth));
    },
  });

  useEffect(() => {
    if (!window.removeHistoryLink) window.removeHistoryLink = removeHistoryLink;
    restoreHistoryLinksFromLocalStorage(
      JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY)) || [],
    );
  }, []);

  useEffect(() => {
    if (tabMenuRef.current) {
      if (getCountBySize(window.innerWidth) !== countOfVisibleLinks)
        setCountOfVisibleLinks(getCountBySize(window.innerWidth));
    }
  }, [tabMenuRef]);

  useEffect(() => {
    bindWindowResizeListener();

    return () => {
      unbindWindowResizeListener();
    };
  }, [bindWindowResizeListener, unbindWindowResizeListener]);

  useEffect(() => {
    const flatArray = history?.links || [];

    if (flatArray.length > countOfVisibleLinks) {
      setVisibleItems(flatArray.slice(0, countOfVisibleLinks));
      setHiddenItems(flatArray.slice(countOfVisibleLinks, flatArray.length));
    } else {
      setVisibleItems(flatArray);
      setHiddenItems([]);
    }
  }, [history.links, countOfVisibleLinks]);

  const items = useMemo(() => {
    const arr = [
      {
        icon: 'pi pi-home',
      },
      ...visibleItems.map(({ title, ID, focus, close }) => ({
        template: () => {
          return (
            <div
              onClick={focus}
              className="p-menuitem-link flex align-items-center bg-bluegray-700 cursor-pointer"
              style={{ height: 31 }}
            >
              {title}
              <i
                onClick={(e) => {
                  e.stopPropagation();
                  removeHistoryLink(ID);
                  close();
                }}
                className="pi pi-times ml-3 cursor-pointer"
              ></i>
            </div>
          );
        },
      })),
    ];
    if (hiddenItems.length) {
      arr.push({
        label: hiddenItems.length,
        template: () => {
          return (
            <div
              onClick={(event) => hiddenLinksMenu.current.toggle(event)}
              className="p-menuitem-link flex align-items-center bg-bluegray-600 cursor-pointer py-2"
            >
              <i className="pi pi-plus mr-3"></i>
              {hiddenItems.length}
            </div>
          );
        },
      });
    }
    return arr;
  }, [visibleItems, hiddenItems]);

  const renderHiddenItems = useMemo(() => {
    return hiddenItems.map(({ title, path, ID, focus, close }) => ({
      command: () => focus(),
      template: (_, options) => {
        return (
          <div onClick={(e) => options.onClick(e)} className="p-menuitem-link">
            {title}
            <i
              onClick={(e) => {
                e.stopPropagation();
                removeHistoryLink({ key: path, ID });
                close();
              }}
              className="pi pi-times ml-3 cursor-pointer"
            ></i>
          </div>
        );
      },
    }));
  }, [hiddenItems]);

  return (
    <>
      <TabMenu
        ref={tabMenuRef}
        className="main-tabs"
        model={items}
        pt={{
          menuitem: {
            className: 'mr-2',
          },
        }}
      />
      <Menu
        pt={{
          menu: {
            className: 'max-h-30rem overflow-y-auto',
          },
        }}
        model={renderHiddenItems}
        popup
        ref={hiddenLinksMenu}
        popupAlignment="right"
      />
    </>
  );
};

export default MainTabs;
