import { createSlice } from '@reduxjs/toolkit';
import { LOCAL_STORAGE_VARIABLES, NAME_ROOT_WINDOW } from 'const';

const initialState = {
  links: [],
};
if (!window.opener) {
  window.name = NAME_ROOT_WINDOW;
}

export const historySlice = createSlice({
  name: 'history',
  initialState,
  reducers: {
    restoreHistoryLinksFromLocalStorage: (state, { payload }) => {
      const links = [];
      for (let i = 0; i < payload.length; i++) {
        const link = payload[i];
        const ID = link.multiple ? link.ID : link.path;
        const wind = window.open('', ID);
        if ((wind && !wind?.location.href.includes(link.path)) || !wind) {
          wind?.close();
          historySlice.caseReducers.removeHistoryLink({ links: payload }, { payload: ID });
          continue;
        }

        const handleTabClose = () => {
          if (payload.windowCustomData) localStorage.removeItem('windowCustomData');
          return window.removeHistoryLink(ID);
        };
        setTimeout(() => {
          if (link.title) {
            wind.document.title = `STS Desktop - ${link?.title}`;
          }
          //TODO: *MUST* investigate how to detect close tab not refresh or reload page to remove this closed window from history (now working for all)
          wind?.addEventListener('beforeunload', handleTabClose);
        }, 700);

        links.push({
          ...link,
          focus: wind?.focus,
          close: wind?.close,
        });
      }

      state.links = links;
    },
    addHistoryLink: (state, { payload }) => {
      if (payload.removeHistoryLink) window.removeHistoryLink = payload.removeHistoryLink;
      if (payload.windowCustomData)
        localStorage.setItem('windowCustomData', JSON.stringify(payload.windowCustomData));
      const sessionHistory = JSON.parse(
        sessionStorage.getItem(LOCAL_STORAGE_VARIABLES.SESSION_STORAGE_HISTORY) || '{}',
      );

      if (payload?.single) {
        const wind = window.open(
          payload.path,
          payload.singleID,
          'left=100px, top=100px, width=1024, height=768',
        );
        if (payload.title) {
          setTimeout(() => {
            wind.document.title = `STS Desktop - ${payload.title} ${
              sessionHistory[payload.parentID] || ''
            }`;
          }, 700);
        }
        return;
      }
      const COUNT = sessionHistory[payload.path] || 0;
      sessionHistory[payload.path] = COUNT + 1;
      !payload.parentID &&
        sessionStorage.setItem(
          LOCAL_STORAGE_VARIABLES.SESSION_STORAGE_HISTORY,
          JSON.stringify(sessionHistory),
        );
      const ID = payload.multiple
        ? payload.path + (sessionHistory[payload.parentID] || COUNT)
        : payload.path + (payload.parentID ? sessionHistory[payload.parentID] || COUNT : '');

      if ((payload.parentID || !payload.multiple) && !!state.links.find((link) => link.ID === ID)) {
        window.open('', ID).focus();
        return;
      }
      const wind = window.open(
        payload.path,
        ID,
        payload.rectangleView
          ? 'left=100px, top=100px, width=768, height=768'
          : 'left=100px, top=100px, width=1024, height=768',
      );

      const TITLE = payload.multiple
        ? `${payload.title} ${sessionHistory[payload.parentID ? payload.parentID : payload.path]}`
        : payload.title;

      const newLink = {
        ...payload,
        title: TITLE,
        ID,
      };

      const handleTabClose = () => {
        if (payload.windowCustomData) localStorage.removeItem('windowCustomData');
        return window.removeHistoryLink(ID);
      };
      setTimeout(() => {
        if (payload.title) {
          wind.document.title = `STS Desktop - ${newLink.title} ${
            sessionHistory[payload.parentID] || ''
          }`;
        }

        //TODO: *MUST* investigate how to detect close tab not refresh or reload page to remove this closed window from history (now working for all)
        wind?.addEventListener('beforeunload', handleTabClose);
      }, 700);

      const links = [
        ...state.links,
        {
          ...newLink,
          focus: wind.focus,
          close: wind.close,
        },
      ];

      const localStorageLinks = [
        ...JSON.parse(localStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY) || '[]'),
        newLink,
      ];
      state.links = links;

      localStorage.setItem(
        LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY,
        JSON.stringify(localStorageLinks),
      );
    },
    removeHistoryLink: (state, { payload }) => {
      const links = state.links.filter(
        ({ ID, parentID }) => ID !== payload || parentID === payload,
      );
      state.links = links;
      const localStorageLinks = JSON.parse(
        localStorage.getItem(LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY) || '[]',
      ).filter(({ ID }) => payload !== ID);
      localStorage.setItem(
        LOCAL_STORAGE_VARIABLES.LOCAL_STORAGE_HISTORY,
        JSON.stringify(localStorageLinks),
      );
    },
  },
});

export const HISTORY_ACTIONS = historySlice.actions;

export default historySlice.reducer;
