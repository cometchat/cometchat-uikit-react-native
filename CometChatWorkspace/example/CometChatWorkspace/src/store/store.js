import {applyMiddleware, compose, createStore} from 'redux';
import rootReducer from './rootReducer';
import ReduxThunk from 'redux-thunk';
import logger from 'redux-logger';
import {persistStore, persistReducer} from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = createStore(
  persistedReducer,
  compose(applyMiddleware(ReduxThunk), applyMiddleware(logger)),
);

export const persistor = persistStore(store);
