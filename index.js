import "react-native-gesture-handler";
import React from "react";
import { AppRegistry } from "react-native";
import { App } from "./src/views/app";
import { name as appName } from "./app.json";
import { createStore, compose, applyMiddleware } from "redux";
import thunk from "redux-thunk";
import { reducers } from "./src/reducers";
import { Provider } from "react-redux";
import BigNumber from "bignumber.js";
import { persistStore, persistReducer } from "redux-persist";
import AsyncStorage from "@react-native-community/async-storage";
import { PersistGate } from "redux-persist/integration/react";
import { NavigationContainer } from "@react-navigation/native";

BigNumber.config({ ROUNDING_MODE: BigNumber.ROUND_HALF_DOWN });

const persistedReducer = persistReducer(
    {
        key: "root",
        storage: AsyncStorage,
        stateReconciler: (persisted) => {
            persisted.prices.loadings = 0;
            persisted.portfolio.loadings = 0;
            return persisted;
        },
    },
    reducers
);

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const store = createStore(
    persistedReducer,
    composeEnhancers(applyMiddleware(thunk))
);
const persistor = persistStore(store);

const Root = () => (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <NavigationContainer>
                <App />
            </NavigationContainer>
        </PersistGate>
    </Provider>
);

AppRegistry.registerComponent(appName, () => Root);
