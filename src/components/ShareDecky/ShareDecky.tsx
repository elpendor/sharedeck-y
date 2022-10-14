import { PanelSection, Router } from 'decky-frontend-lib';
import { useContext, useEffect } from 'react';
import { AppContext } from '../../context/Context';
import { ActionType } from '../../reducers/ShareDeckReducer';
import { DefaultProps, getReports } from '../../utils';
import { shareDeckBaseUrl } from '../../constants';
import { ReportInterface, Report } from '../Report/Report';
import {ReportElement } from '../Report/ReportElement';
import BuyCoffee from '../BuyCoffee/BuyCoffee';
import ScrollSection from '../ScrollSection/ScrollSection';

export const ShareDecky = ({ serverApi }: DefaultProps) => {

    // const writeLog = async (content: any) => {
    //     let text = `${content}`;
    //     serverApi.callPluginMethod<{content: string}>("log", {content: text});
    // };

    // writeLog('Starting ShareDecky');
    const {
        state: { runningGame, isLoading, reports },
        dispatch,
    } = useContext(AppContext);
    
    const handleSteamAppStateChange = ({ bRunning }: AppState) => {
        if (!bRunning) {
            dispatch({
                type: ActionType.UPDATE_RUNNING_GAME,
                payload: undefined,
            });
        }
    };

    const handleGameActionStart = (
        _actionType: number,
        strAppId: string,
        _actionName: string
    ) => {
        dispatch({
            type: ActionType.UPDATE_RUNNING_GAME,
            payload: strAppId,
        });
    };

    useEffect(() => {

        const getGame = async (): Promise<string | undefined> => {
            const currentGame = Router.MainRunningApp?.appid;
            return currentGame;
        }

        const handleReports = (data: ReportInterface[]) => {
            // writeLog('Handling reports');
            dispatch({
                type: ActionType.UPDATE_REPORTS,
                payload: data,
            })
        }    
        
        getGame().then((currentGame) => {
            if (currentGame != runningGame) {
                // writeLog('Game has changed');
                dispatch({
                    type: ActionType.UPDATE_RUNNING_GAME,
                    payload: currentGame,
                });
            
                if (currentGame != null && reports == null && !isLoading) {
                    // writeLog('Is Calling Get Reports');
                    dispatch({
                        type: ActionType.START_LOADING,
                    });
                    getReports(shareDeckBaseUrl + currentGame, serverApi, handleReports);
                } else {
                    // writeLog('Not calling get reports');
                }
            }
        });

        const onAppStateChange = 
            SteamClient.GameSessions.RegisterForAppLifetimeNotifications(
                handleSteamAppStateChange
            );

        const onGameActionStart = SteamClient.Apps.RegisterForGameActionStart(
            handleGameActionStart
        );

        return function cleanup() {
            onAppStateChange.unregister();
            onGameActionStart.unregister();
        }

    });

    if (runningGame == null) {
        // writeLog('ShareDeck-y Norunning condition');
        return <PanelSection title="Open a game to see ShareDeck Reports"><BuyCoffee/></PanelSection>
    };

    let appDetails = appStore.GetAppOverviewByGameID(parseInt(runningGame));

    if (isLoading) {
        // writeLog('ShareDeck-y isLoading condition');
        return <PanelSection spinner={true} title={appDetails.display_name}></PanelSection>
    }

    let reportObjects = []

    if (reports == null || reports.length == 0) {
        return <PanelSection title={appDetails.display_name}>No Reports Found<BuyCoffee/></PanelSection>
    } else {
        for (let i = 0; i < reports.length; i++) {
            let report = new Report(reports[i] as ReportInterface)
            reportObjects.push(
                ReportElement({report: report})
            );
        };
    };

    // writeLog('ShareDeck-y Other condition');
    return (
    <div>
        <ScrollSection/>
        <PanelSection>{appDetails.display_name}</PanelSection>
        {reportObjects}
        <BuyCoffee/>
    </div>
    )
}