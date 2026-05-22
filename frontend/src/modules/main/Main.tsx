import { useCallback, useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

const Main = () => {
    const location = useLocation();

    // Reset scroll positions on route change
    useLayoutEffect(() => {
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        document.getElementById("root")?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }, [location.pathname]);

    const getAppTemplate = useCallback(() => (
        <div className="min-h-screen">
            <section className="mx-auto w-full max-w-[92rem] px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
                <Outlet />
            </section>
        </div>
    ), []);

    return <div className="wrapper">{getAppTemplate()}</div>
}

export default Main;
