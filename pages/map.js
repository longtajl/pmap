import Layout from "../comps/MyLayout";
import fetch from "isomorphic-unfetch"
import * as d3 from "d3";

const width = 800, height = 600, scale = 1300;

// https://qiita.com/sand/items/422d4fab77ea8f69dfdf

class Map extends React.Component {

    static async getInitialProps({ req }) {
        const geojson = await fetch("http://localhost:3000/api/geo").then(r => r.json());
        return { geojson }
    }

    renderMap() {
        // map情報
        const geoJson = this.props.geojson;

        // メルカトル図法
        const projection = d3.geoMercator()
            .center([136, 35.6])
            .translate([width/2, height/2])
            .scale(scale);

        const path = d3.geoPath().projection(projection);

        // svg取得
        const svg = d3.select("svg");

        // map描写
        const map = svg.selectAll("path").data(geoJson.features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#fff")
            .style("stroke-width", 0.1)
            .style("fill", "#A2D29E");

        // ドラックイベント
        const dragEvent = d3.drag().on('drag', function () {
            const tl = projection.translate();
            console.log(tl);
            projection.translate([tl[0] + d3.event.dx, tl[1] + d3.event.dy]);
            map.attr('d', path);
        });
        map.call(dragEvent);

        // ズームイベント
        const zoomEvent = d3.zoom().on("zoom", () => {
            projection.scale(scale * d3.event.transform.k);
            map.attr('d',path)
        });
        svg.call(zoomEvent);
    }

    componentDidMount() {
        console.log("componentDidMount");
        this.renderMap();
    }

    render()    {
        return (
            <Layout>
                <div className="test"/>
                <svg width={width}
                     height={height}
                     ref="svg"
                     style={{background: 'rgba(124, 224, 249, .3)'}}>
                </svg>
                <style>{`
                `}
                </style>
            </Layout>
        )
    }
}

export default Map;
