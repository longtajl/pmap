import Layout from "../comps/MyLayout";
import fetch from "isomorphic-unfetch"
import * as topojson from "topojson-client";
import * as d3 from "d3";

const width = 800, height = 700, scale = 1000, maxlat = 83;

class Map extends React.Component {

    static async getInitialProps({req}) {
        //let host = "https://pmap.now.sh/";
        let host = "http://localhost:3000/";
        //if(window.location.host.includes("localhost")) {
        //    host = "http://localhost:3000/"
        //} else {
        //    host = "https://pmap.now.sh/"
        //}
        //const geojson = await fetch(host + "api/jpgeo").then(r => r.json());
        const topo = await fetch(host + "land-50m.json").then(r => r.json());
        const preferences = await fetch(host + "api/prefectures").then(r => r.json());
        return { topo, preferences }
    }

    renderMap() {

        function mercatorBounds(projection, maxlat) {
            const yaw = projection.rotate()[0],
                xymax = projection([-yaw+180-1e-6,-maxlat]),
                xymin = projection([-yaw-180+1e-6, maxlat]);
            return [xymin,xymax];
        }

        // map情報
        const world = this.props.topo;
        const features = topojson.feature(world, world.objects.land).features;

        // メルカトル図法
        const projection = d3.geoMercator()
            .center([136, 35.6])
            .translate([width / 2, height / 2])
            .scale(scale);

        const path = d3.geoPath().projection(projection);

        // svg取得
        const svg = d3.select("svg");

        // map描写
        const map = svg.selectAll("path").data(features)
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
                return "24px";
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

        //const b = mercatorBounds(projection, maxlat),
        //    s = width/(b[1][0]-b[0][0]),
        //    scaleExtent = [s, 10*s];

        //const zoom = d3.zoom()
        //    .scaleExtent(scaleExtent)
        //    //.scale(projection.scale())
        //    //.translate([0,0])
        //    .on("zoom", redraw);

        // ズームリセット ボタン
        d3.select("#ResetButton").on('click', () => {
            svg.transition().duration(750)
                .call(zoomEvent.transform, d3.zoomIdentity);
        });
    }

    componentDidMount() {
        this.renderMap();
    }

    render() {
        return (
            <div className="Main">
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
                .Main {
                }
                .MapContainer {
                  position: relative;
                  background-color: #424949;
                  width: 800px;
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
            </div>
        )
    }
}

export default Map;
