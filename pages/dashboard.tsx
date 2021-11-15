import { useContext, useEffect } from "react";
import { Can } from "../components/Can";
import { AuthContext } from "../contexts/AuthContext";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

function Dashboard() {
    const { user, signOut } = useContext(AuthContext);

    useEffect(() => {
        api.get('/me').then(response => console.log(response.data))
        .catch(err => console.log(err));
    }, []);

    return (
        <>
            <h1>Dashboard: {user?.email}</h1>

            <button onClick={signOut}>Sign out</button>

            <Can permissions={['metrics.list','metrics.create']}>
                <div>Métricas</div>
            </Can>
        </>
    );
}

export default Dashboard;

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx);
    const response = await apiClient.get('/me');

    console.log(response);

    return {
        props: {},
    }
});