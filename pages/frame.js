import Layout from "../comps/MyLayout";

export default function Index() {
    return (
        <Layout>
            <h1>iframe</h1>
            <iframe
                width="500"
                height="400"
                src="https://pmap.now.sh/map">
                対応してないよ
            </iframe>
        </Layout>
    )
}
