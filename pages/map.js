import fetch from "isomorphic-unfetch";
import * as topojson from "topojson-client";
import * as d3 from "d3";
import prefectures from "../data/prefectures";
import data from "../data/data";

const width = 900, height = 700, scale = 1200;
const circlesSize = 30;
const defaultScale = 1200;

const reducer = (accumulator, currentValue) => accumulator + currentValue;

class Map extends React.Component {

    constructor(props) {
        super(props);
        const lastIndex = props.coronaDataList.length - 1;
        const currentData = props.coronaDataList[lastIndex];
        this.state = {
            currentData: currentData,
            totalCount: currentData.counts.reduce(reducer),
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
        const preferences = prefectures.list;
        const coronaDataList = data.coronaDataList;
        return {topo, preferences, coronaDataList}
    }

    d3Projection() {
        return d3.geoMercator()
            .center([136, 35.6])
            .translate([width / 2, height / 2])
            .scale(scale);
    }

    renderMap() {
        // map情報
        const world = this.props.topo;
        const features = topojson.feature(world, world.objects.land).features;

        // メルカトル図法
        const projection = this.d3Projection();

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
        const circles = svg.selectAll("circle").data(laloList).enter().append("circle");
        this.drawCircle(circles);

        // ズームリセット ボタン
        d3.select("#ResetButton").on('click', () => {
            svg.transition().duration(750).call(zoomEvent.transform, d3.zoomIdentity);
        });
    }

    updateRenderMap() {
        const svg = d3.select("svg");
        const laloList = this.props.preferences.map(p => [p.lon, p.lat]);
        const circles = svg.selectAll("circle").data(laloList);
        this.drawCircle(circles);
    }

    drawCircle(circle) {
        const projection = this.d3Projection();
        circle.attr("cx", (d) => {
            return projection(d)[0];
        })
            .attr("cy", (d, i) => {
                return projection(d)[1];
            })
            .attr("r", (d, i) => {
                const count = this.state.currentData.counts[i];
                if (!count || count === 0) {
                    return "0px"
                }
                const dd = scale / defaultScale;
                const size = circlesSize * dd;
                return size + "px";
            })
            .attr("fill", (d, i) => {
                const c = d3.color("#C90000");
                const count = this.state.currentData.counts[i];
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
                this.setState({currentCountText: ""})
            })
            .on("mouseover", (d, i) => {
                const preference = this.props.preferences[i];
                const count = this.state.currentData.counts[i];
                this.setState({currentCountText: preference["name-ja"] + ": " + count + "人"})
            });
    }

    changeCurrentData(data) {
        this.setState({
            currentData: data,
            totalCount: data.counts.reduce(reducer)
        }, () => {
            this.updateRenderMap()
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
                        <p>{this.state.currentData.day} 感染者数: {this.state.totalCount}人 {this.state.currentCountText}</p>
                    </div>
                    <div className="FooterArea">
                        <div className="DayNav">
                            {this.props.coronaDataList.map((data) => {
                                let className = this.state.currentData.day === data.day ?  "DayArea" : "DayAreaActive";
                                return (
                                    <div className={className} key={data.day}
                                         onClick={() => this.changeCurrentData(data)}
                                         onMouseEnter={() => this.changeCurrentData(data)}>
                                        <div style={{"margin-left": "5px", "margin-right": "5px"}}>{data.day.replace("2020/","")}</div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
                <style>{`
                .MapContainer {
                  position: relative;
                  background-color: #424949;
                  width: ${width}px;
                  height: 700px;
                }
                .RightArea {
                  position: absolute;
                  right: 30px;
                  top: 30px;
                }
                .HeaderArea {
                  position: absolute;
                  top: 0px;
                  left: 10px;
                }
                .FooterArea {
                  position: absolute;
                  bottom: 0px;
                  left: 0px;
                  width: ${width}px;
                }
                .DayNav {
                  width: ${width}px;
                  background-color: #C0C0C0;
                  display: flex;
                  flex-direction: row;
                  overflow: scroll;
                }
                .DayArea {
                  line-height: 50px;
                  background-color: #AAA;
                  margin-left: 1px;
                  margin-right: 1px;
                }
                .DayArea::-webkit-scrollbar {
                  display: none;
                }
                .DayAreaActive {
                  line-height: 50px;
                  background-color: #BBB;
                  margin-left: 1px;
                  margin-right: 1px;
                }
                `}
                </style>
            </div>
        )
    }
}

export default Map;
