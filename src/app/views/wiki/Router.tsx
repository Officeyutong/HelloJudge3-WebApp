import React, { lazy, Suspense } from "react";
import { useRouteMatch } from "react-router";
import { Route } from "react-router-dom";
import GeneralDimmedLoader from "../utils/GeneralDimmedLoader";


const WikiVersionList = lazy(() => import("./WikiVersionList"));
const WikiEdit = lazy(() => import("./WikiEdit"));
const WikiConfig = lazy(() => import("./config/WikiConfig"));
const WikiPage = lazy(() => import("./page/WikiPage"));
const WikiRouter: React.FC<{}> = () => {
    const match = useRouteMatch();
    return <>
        <Route exact path={`${match.path}/versions/:page`}>
            <Suspense fallback={<GeneralDimmedLoader />}>
                <WikiVersionList></WikiVersionList>
            </Suspense>
        </Route>
        <Route exact path={`${match.path}/edit/:page?`}>
            <Suspense fallback={<GeneralDimmedLoader />}>
                <WikiEdit></WikiEdit>
            </Suspense>
        </Route>
        <Route exact path={`${match.path}/config`}>
            <Suspense fallback={<GeneralDimmedLoader />}>
                <WikiConfig></WikiConfig>
            </Suspense>
        </Route>
        <Route exact path={`${match.path}/page/:page?`}>
            <Suspense fallback={<GeneralDimmedLoader />}>
                <WikiPage></WikiPage>
            </Suspense>
        </Route>

    </>
};

export default WikiRouter;
