import Layout from "../comps/MyLayout";
import fetch from "isomorphic-unfetch";
import * as topojson from "topojson-client";
import * as d3 from "d3";

const width = 1200, height = 700, scale = 1200;

const circlesSize = 20;
const defaultScale = 1200;

// ラベル
const labelWidth = 120;
const labelHeight = 36;

const reducer = (accumulator, currentValue) => accumulator + currentValue;

class Map extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            totalCount: props.preferences.map(r => r.count).reduce(reducer),
            currentCountText: ""
        };
    }

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

        // svg取得
        const svg = d3.select("svg");

        // Path
        const path = d3.geoPath().projection(projection);

        // map描写
        const map = svg.selectAll("path").data(features)
            .enter()
            .append("path")
            .attr("d", path)
            .style("stroke", "#424949")
            .style("stroke-width", 0.1)
            .style("fill", function (d) {
                return "#808080"
            });

        // ズームイベント
        const zoomEvent = d3.zoom().on("zoom", () => {
            map.attr("transform", d3.event.transform);
            circles.attr("transform", d3.event.transform);
        });
        svg.call(zoomEvent);

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
                const preference = this.props.preferences[i];
                const c = d3.color("#C90000");
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
                //svg.selectAll("g").data([]).exit().remove()
                this.setState({ currentCountText: ""})
            })
            .on("mouseover", (d, i) => {
                console.log(this.state.totalCount);
                const preference = this.props.preferences[i];
                this.setState({ currentCountText: preference["name-ja"] +": "+ preference.count })

                // const transform = d3.zoomTransform(svg.node());
                // const x = (projection(d)[0] * transform.k) + transform.x;
                // const y = (projection(d)[1] * transform.k) + transform.y;
                //
                // const pref = this.props.preferences[i];
                // const node = svg.selectAll("g").data([i]).enter().append("g")
                //     .attr("transform", "translate(" + x + "," + y + ")");
                //
                // node.append("rect")
                //     .attr("width", labelWidth)
                //     .attr("height", labelHeight)
                //     .attr("fill", "#DCDCDC");
                //
                // node.append('text')
                //     .attr("y", 25)
                //     .attr("x", 10)
                //     .attr("fill", "#000")
                //     .text(pref["name-ja"] + "\n" + pref.count + "人");
            });

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
            <div>
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
                        <p>Total: {this.state.totalCount}</p>
                        <p>{this.state.currentCountText}</p>
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
            </div>
        )
    }
}

export default Map;
