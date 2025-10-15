import { useEffect } from "react";

const Index = () => {
 
    useEffect(() => {
        if(window.location.pathname === "/") {
            window.location.href = "/texts";
        }
    }, []);

    return (
    <></>
    );
};

export default Index;
