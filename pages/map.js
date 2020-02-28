import Layout from "../comps/MyLayout";
import fetch from "isomorphic-unfetch"
import * as d3 from "d3";

const width = 1200, height = 700, scale = 1300;

class Map extends React.Component {

    static async getInitialProps({req}) {
        const geojson = await fetch("http://localhost:3000/api/geo").then(r => r.json());
        //const jpgeoJson = await fetch("http://localhost:3000/api/jpgeo").then(r => r.json());
        const preferences = await fetch("http://localhost:3000/api/prefectures").then(r => r.json());
        return { geojson, preferences }
    }

    renderMap() {
        // map情報
        const geoJson = this.props.geojson;
        const jpgeoJson = this.props.jpgeoJson;

        // メルカトル図法
        const projection = d3.geoMercator()
            .center([136, 35.6])
            .translate([width / 2, height / 2])
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
                return "";
            })
            .style("stroke", "#424949")
            .style("stroke-width", 0.1)
            .style("fill", function (d) {
                return "#808080"
            });

        // Circles
        const laloList = this.props.preferences.map(p => [p.lon, p.lat]);
        const circles = svg.selectAll("circle").data(laloList).enter()
            .append("circle")
            .attr("cx", (d) => {
                return projection(d)[0];
            })
            .attr("cy", (d, i) => {
                return projection(d)[1];
            })
            .attr("r", (d, i) => {
                const preference = this.props.preferences[i];
                const count = preference.count;
                if (count === 0) {
                    return "0px"
                }
                return "30px";
            })
            .attr("fill", (d, i) => {
                const c = d3.color("red");

                const preference = this.props.preferences[i];
                const count = preference.count;
                if (count <= 5) {
                    c.opacity = 0.2;
                } else if (count <= 10) {
                    c.opacity = 0.25;
                } else if (count <= 20) {
                    c.opacity = 0.333;
                } else {
                    c.opacity = 0.47;
                }

                return c;
            });

        // ズームイベント
        const zoomEvent = d3.zoom().on("zoom", () => {
            map.attr("transform", d3.event.transform);
            circles.attr("transform", d3.event.transform)
        });
        svg.call(zoomEvent);

        // ズームリセット ボタン
        d3.select("#ResetButton").on('click', () => {
            console.log(d3.zoomIdentity);
            svg.transition().duration(750)
                .call(zoomEvent.transform, d3.zoomIdentity);
        });
    }

    componentDidMount() {
        this.renderMap();
    }

    render() {
        return (
            <Layout>
                <div className="MapContainer">
                    <svg width={width}
                         height={height}
                         ref="svg"
                         style={{background: '#424949'}}>
                    </svg>
                    <div className="RightArea">
                        <button id="ResetButton">Reset</button>
                    </div>
                    <div className="HeaderArea">
                        <p>total: 0</p>
                    </div>
                </div>
                <style>{`
                .MapContainer {
                  position: relative;
                  background-color: #424949;
                  width: 1200px;
                  height: 700px;
                }
                .RightArea {
                  position: absolute;
                  right: 30px;
                  bottom: 30px;
                }
                .HeaderArea {
                  position: absolute;
                  top: 30px;
                  left: 30px;
                }
                `}
                </style>
            </Layout>
        )
    }
}

export default Map;
