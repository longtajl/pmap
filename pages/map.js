import fetch from "isomorphic-unfetch";
import {withRouter} from 'next/router'
import * as topojson from "topojson-client";
import * as d3 from "d3";
import prefectures from "../data/prefectures";
import data from "../data/data";

const scale = 1200;
const circlesSize = 15;
const defaultScale = 1200;

const reducer = (accumulator, currentValue) => accumulator + currentValue;

class Map extends React.Component {

    constructor(props) {
        super(props);

        const { router } = props;
        const {d, w, h} = router.query;

        let lastIndex = props.coronaDataList.length - 1;
        if (d) {
            const index = props.coronaDataList.findIndex((data) => data.day.replace(/\//g, "") === d);
            if (index !== -1) {
                lastIndex = index;
            }
        }

        let width = 400, height = 650;
        const qWidth = parseInt(w, 10), qHeight = parseInt(h, 10);
        if (qWidth && qWidth > width) width = qWidth;
        if (qHeight && qHeight > height) height = qHeight;

        let currentData = props.coronaDataList[lastIndex];
        this.footer = React.createRef();

        this.state = {
            currentIndex: lastIndex,
            currentData: currentData,
            mouseOverPrefectureId: -1,
            totalCount: currentData.counts.reduce(reducer),
            svgWidth: width,
            svgHeight: height,
            preferencesCountDesc: []
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
            .translate([this.state.svgWidth / 2, this.state.svgHeight / 2])
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
                const size = circlesSize * dd * (1 + count / 100);
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
                this.setState({mouseOverPrefectureId: -1})
            })
            .on("mouseover", (d, i) => {
                const preference = this.props.preferences[i];
                const count = this.state.currentData.counts[i];
                this.setState({mouseOverPrefectureId: preference.id})
            });
    }

    changeCurrentData(data, i) {
        this.setState({
            currentIndex: i,
            currentData: data,
            totalCount: data.counts.reduce(reducer),
            preferencesCountDesc: this.generatePreferencesCountDesc(this.state.currentData.counts, this.props.preferences)
        }, () => {
            this.updateRenderMap()
        });
    }

    componentDidMount() {
        this.renderMap();

        const element = this.footer.current;
        element.scrollLeft = element.scrollWidth - element.clientWidth;
        this.setState({
            preferencesCountDesc: this.generatePreferencesCountDesc(this.state.currentData.counts, this.props.preferences)
        });
    }

    generatePreferencesCountDesc(counts, preferences) {
        return this.state.currentData.counts
            .map((data, i) => Object.assign({count: data}, this.props.preferences[i]))
            .filter(d => d.count > 0).sort((a, b) => b.count - a.count);
    }

    render() {
        return (
            <div>
                <div className="MapContainer">
                    <svg width={this.state.svgWidth}
                         height={this.state.svgHeight}
                         ref="svg"
                         style={{background: '#2A2A2A'}}>
                    </svg>
                    <div className="RightArea">
                        <button id="ResetButton">Reset</button>
                    </div>
                    <div className="LeftArea">
                        <div>
                            {this.state.preferencesCountDesc.map((p, i) => {
                                let color = this.state.mouseOverPrefectureId === p.id ? "red" : "white";
                                return (
                                    <div key={i} style={{"fontSize": "12px", "color": color}}>{p["name-ja"]} {p.count}人</div>
                                )
                            })}
                        </div>
                    </div>
                    <div className="HeaderArea">
                        <span style={{ "fontSize": "20px", "color": "white" }}>
                            {this.state.currentData.day} 感染者数: {this.state.totalCount}人
                        </span>
                    </div>
                    <div className="FooterArea" ref={this.footer}>
                        <div className="DayNav">
                            {this.props.coronaDataList.map((data, i) => {
                                let className = this.state.currentData.day === data.day ? "DayAreaActive" : "DayArea";
                                return (
                                    <div className={className} key={data.day}
                                         onClick={() => this.changeCurrentData(data, i)}
                                         onMouseEnter={(e) => {
                                             this.changeCurrentData(data);
                                         }}>
                                        <div style={{
                                            "marginLeft": "5px",
                                            "marginRight": "5px",
                                            "color": "white"
                                        }}>{data.day.replace("2020/", "")}</div>
                                    </div>
                                )
                            })}
                            <div className="DayBlank"/>
                        </div>
                    </div>
                </div>
                <style>{`
                .MapContainer {
                  position: relative;
                  background-color: #424949;
                  width: ${this.state.svgWidth}px;
                  height: ${this.state.svgHeight}px;
                }
                .RightArea {
                  position: absolute;
                  right: 30px;
                  top: 30px;
                }
                .LeftArea {
                  position: absolute;
                  left: 10px;
                  top: 40px;
                }
                .HeaderArea {
                  position: absolute;
                  top: 10px;
                  left: 10px;
                }
                .FooterArea {
                  position: absolute;
                  bottom: 0px;
                  left: 0px;
                  width: ${this.state.svgWidth}px;
                  white-space: nowrap;
                  overflow-x: auto;
                  -webkit-overflow-scrolling: touch;
                }
                .DayNav {
                  width: ${this.state.svgWidth}px;
                  background-color: rgba(52,52,52,.A);
                  display: flex;
                }
                .FooterArea::-webkit-scrollbar {
                  display: none;
                }
                .DayArea {
                  line-height: 50px;
                  background-color: rgba(51,51,51,.8);
                  margin-left: 1px;
                  margin-right: 1px;
                  flex-basis: 120px;
                  flex-shrink: 1;
                }
                .DayBlank {
                  line-height: 50px;
                  background-color: rgba(51,51,51,.8);
                  flex-shrink: 2;
                }
                .DayAreaActive {
                  flex-basis: 120px;
                  flex-shrink: 1;
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

export default withRouter(Map);
