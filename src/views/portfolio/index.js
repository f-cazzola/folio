import React, { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useState, useEffect } from "react";
import { Decimal } from "decimal.js";
import { Header } from "../../components/header";
import { StyleSheet, View } from "react-native";
import { getPortfolio, resetPortfolio } from "../../actions/portfolio";
import { List } from "../../components/list";
import { CryptoIcon } from "../../components/crypto-icon";
import { ThemeContext } from "../../contexts/theme";
import { getCoinGeckoIds } from "../../actions/coingecko";
import { CURRENCY_SYMBOLS } from "../../commons";
import { formatDecimal } from "../../utils";

export const Portfolio = ({ navigation }) => {
    const theme = useContext(ThemeContext);

    const styles = StyleSheet.create({
        root: {
            height: "100%",
            backgroundColor: theme.background,
        },
        headerContainer: {
            paddingHorizontal: 16,
            marginVertical: 20,
        },
    });

    const dispatch = useDispatch();
    const {
        portfolio,
        loadingPortfolio,
        accounts,
        fiatCurrency,
        coinGeckoIds,
    } = useSelector((state) => ({
        portfolio: state.portfolio.data,
        loadingPortfolio: !!state.portfolio.loadings,
        accounts: state.accounts,
        fiatCurrency: state.settings.fiatCurrency,
        coinGeckoIds: state.coinGecko.ids,
    }));

    const [aggregatedPortfolio, setAggregatedPortfolio] = useState([]);
    const [symbols, setSymbols] = useState([]);

    useEffect(() => {
        dispatch(getCoinGeckoIds());
    }, [dispatch]);

    useEffect(() => {
        if (!accounts || accounts.length === 0) {
            dispatch(resetPortfolio());
        }
    }, [accounts, dispatch]);

    useEffect(() => {
        if (coinGeckoIds) {
            dispatch(getPortfolio(accounts, fiatCurrency, coinGeckoIds));
        }
    }, [accounts, coinGeckoIds, dispatch, fiatCurrency]);

    useEffect(() => {
        if (portfolio && portfolio.length > 0) {
            setSymbols(
                portfolio.reduce((uniqueSymbols, asset) => {
                    if (uniqueSymbols.indexOf(asset.symbol) < 0) {
                        uniqueSymbols.push(asset.symbol);
                    }
                    return uniqueSymbols;
                }, [])
            );
        }
    }, [portfolio]);

    useEffect(() => {
        if (!loadingPortfolio && portfolio && portfolio.length > 0) {
            setAggregatedPortfolio(
                symbols
                    // sum the balance of every entry with the same symbol to
                    // get the aggregated balance
                    .reduce((finalPortfolio, symbol) => {
                        const assetsBySymbol = portfolio.filter(
                            (asset) =>
                                asset.symbol.toLowerCase() ===
                                symbol.toLowerCase()
                        );
                        const totalBalance = assetsBySymbol.reduce(
                            (totalBalanceForSymbol, asset) =>
                                totalBalanceForSymbol.plus(asset.balance),
                            new Decimal("0")
                        );
                        const { currentPrice, icon } = assetsBySymbol[0].info;
                        const value = totalBalance.times(currentPrice);
                        finalPortfolio.push({
                            symbol,
                            balance: totalBalance,
                            price: currentPrice,
                            value,
                            icon: icon,
                        });
                        return finalPortfolio;
                    }, [])
                    .sort((a, b) => b.value.minus(a.value).toNumber())
            );
        }
    }, [portfolio, symbols, loadingPortfolio]);

    const handleRefresh = useCallback(() => {
        if (coinGeckoIds) {
            dispatch(getPortfolio(accounts, fiatCurrency, coinGeckoIds));
        }
    }, [accounts, coinGeckoIds, dispatch, fiatCurrency]);

    return (
        <View style={styles.root}>
            <View style={styles.headerContainer}>
                <Header
                    portfolio={aggregatedPortfolio}
                    fiatCurrency={fiatCurrency}
                    navigation={navigation}
                />
            </View>
            <List
                header="Your assets"
                items={aggregatedPortfolio.map((asset) => ({
                    key: asset.symbol,
                    icon: <CryptoIcon icon={asset.icon} size={36} />,
                    primary: asset.symbol,
                    tertiary: formatDecimal(asset.balance, 3),
                    quaternary: `${
                        CURRENCY_SYMBOLS[fiatCurrency.toUpperCase()]
                    }${formatDecimal(asset.value, 2)}`,
                }))}
                onRefresh={handleRefresh}
                refreshing={loadingPortfolio}
            />
        </View>
    );
};
