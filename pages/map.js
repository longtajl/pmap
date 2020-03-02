import Layout from "../comps/MyLayout";
import fetch from "isomorphic-unfetch";
import * as topojson from "topojson-client";
import * as d3 from "d3";

const width = 1200, height = 700, scale = 1200;

const circlesSize = 20;
const defaultScale = 1200;

// ラベル
const labelWidth = 120;
const labelHeight = 40;

class Map extends React.Component {

    static async getInitialProps({req}) {
        let host;
        if (process.env.NODE_ENV === 'production') {
            host = "https://pmap.now.sh/"
        } else {
            host = "http://localhost:3000/"
        }
        const topo = await fetch(host + "land-50m.json").then(r => r.json());
        const preferences = await fetch(host + "api/prefectures").then(r => r.json());
        return {topo, preferences}
    }

    mercatorBounds(projection, maxlat) {
        const yaw = projection.rotate()[0],
            xymax = projection([-yaw + 180 - 1e-6, -maxlat]),
            xymin = projection([-yaw - 180 + 1e-6, maxlat]);
        return [xymin, xymax];
    }

    renderMap() {
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
                const dd = scale / defaultScale;
                const size = circlesSize * dd;
                return size + "px";
            })
            .attr("fill", (d, i) => {
                const c = d3.color("#C90000");

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
            })
            .on("mouseout", (d, i) => {
                svg.selectAll("g").data([]).exit().remove()
            })
            .on("mouseover", (d, i) => {
                const x = projection(d)[0] - labelWidth / 4;
                const y = projection(d)[1] - labelHeight * 1.8;

                const pref = this.props.preferences[i];
                const node = svg.selectAll("g").data([i]).enter().append("g")
                    .attr("transform", "translate(" + x + "," + y + ")");
                node.append("rect")
                    .attr("width", labelWidth)
                    .attr("height", labelHeight)
                    .attr("fill", "#DCDCDC");

                node.append('text')
                    .attr("y", 25)
                    .attr("x", 10)
                    .attr("fill", "#000")
                    .text(pref["name-ja"] + "\n" + pref.count + "人");
            });

        // ズームイベント
        const zoomEvent = d3.zoom().on("zoom", () => {
            map.attr("transform", d3.event.transform);
            circles.attr("transform", d3.event.transform);

            const node = svg.selectAll("g");
            node.attr("transform", d3.event.transform)
        });
        svg.call(zoomEvent);

        //const b = mercatorBounds(projection, maxlat),
        //    s = width/(b[1][0]-b[0][0]),
        //    scaleExtent = [s, 10*s];

        //const zoom = d3.zoom
        //    .scaleExtent(scaleExtent)
        //    .scale(projection.scale())
        //    .translate([0,0]) // not linked directly to projection
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
        const reducer = (accumulator, currentValue) => accumulator + currentValue;
        const totalCount = this.props.preferences.map(r => r.count).reduce(reducer);
        return (
            <Layout>
                <div className="MapContainer">
                    <svg width={width}
                         height={height}
                         ref="svg"
                         style={{background: '#2A2A2A'}}>
                    </svg>
                    <div className="RightArea">
                        <button id="ResetButton">Reset</button>
                    </div>
                    <div className="HeaderArea">
                        <p>Total: {totalCount}</p>
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
