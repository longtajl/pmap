import Layout from "../comps/MyLayout";
import fetch from "isomorphic-unfetch"
import  useSWR from 'swr';
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
            .attr("class", (d) => {
                console.log(d);
                return "";
            })
            .style("stroke", "#fff")
            .style("stroke-width", 0.1)
            .style("fill", function (d) {
                return "#000"
            });

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

        // ズームリセット ボタン
        d3.select("#ResetButton").on('click', () => {
            svg.transition().duration(750)
                .call(zoomEvent.transform, d3.zoomIdentity);
        });
    }

    componentDidMount() {
        this.renderMap();
    }

    render()    {
        return (
            <Layout>
                <div className="test"/>
                <svg width={width}
                     height={height}
                     ref="svg"
                     style={{background: 'white'}}>
                </svg>
                <button id="ResetButton">Reset</button>
                <style>{`
                `}
                </style>
            </Layout>
        )
    }
}

export default Map;
