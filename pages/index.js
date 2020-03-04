import Layout from "../comps/MyLayout";
import Link from "next/link";

const linkStyle = {
    marginRight: 15
};

export default function Index() {
    return (
        <Layout>
            <h1>Map</h1>
            <Link href="/map">
                <a style={linkStyle}>コロナ</a>
            </Link>
        </Layout>
    )
}
