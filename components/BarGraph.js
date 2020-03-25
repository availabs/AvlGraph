import React from "react"

import ComponentBase, { getColorFunc, getUniqueId } from "./ComponentBase"
import DataManager from "./DataManager"

import get from "lodash.get"
import deepequal from "deep-equal"

import d3 from "./d3"

const HoverComp = ({ data, idFormat, xFormat, yFormat }) =>
  <table className="table table-sm">
    <thead>
      <tr>
        <th colSpan={ 3 }>{ xFormat(data.x) }</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><div style={ { width: "15px", height: "15px", background: data.color } }/></td>
        <td>{ idFormat(data.key) }</td>
        <td>{ yFormat(data.value) }</td>
      </tr>
    </tbody>
  </table>,

  getDomainX = data => data.length ? data.map(d => d.x) : null,
  getDomainY = (data, keys) => {
      if (!data.length) return null;
      if (!keys.length) {
        const keyMap = {};
        data.forEach(bar => {
          let { x, ...rest } = bar;
          for (const k in rest) {
            keyMap[k] = true;
          }
        })
        keys = Object.keys(keyMap);
      }
      const max = data.reduce((a, c) => Math.max(a, d3.sum(keys.map(k => c[k]))), 0);
      return [0, max];
  };

class BarGraphBase extends ComponentBase {
  static defaultProps = ComponentBase.generateDefaultProps({
    HoverComp,
    keys: [],
    getDomainX,
    getDomainY
  })
  static getDerivedStateFromProps(props, state) {
    const { id } = state;

    let {
      data,
      width,
      height,
      margin: { top, right, bottom, left },
      keys,
      yDomain,
      xDomain,
      registerData
    } = props;

    const {
      // entering,
      // updating,
      exiting
    } = props;

    if (width === 0 || height === 0) return null;

    const adjustedWidth = Math.max(0, width - left - right),
      adjustedHeight = Math.max(0, height - top - bottom);

    const xScale = d3.scaleBand()
        .domain(xDomain)
        .range([0, adjustedWidth]);

    const barWidth = xScale.bandwidth();

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([0, adjustedHeight]);

    if (!keys.length) {
      const keyMap = {};
      data.forEach(bar => {
        let { x, ...rest } = bar;
        for (const k in rest) {
          keyMap[k] = true;
        }
      })
      keys = Object.keys(keyMap);
    }

    const exitingData = state.barData.filter(({ x }) => (x in exiting))
      .map(d => ({ ...d, state: "exiting" }));

    const getColor = getColorFunc(props);

    const dataToRegister = {};

    const barData = data.map((d, i) => {
      let current = 0;
      const bar = keys.map((key, ii) => {
        const value = get(d, key, 0),
          height = yScale(value),
          stack = {
            key,
            width: barWidth,
            height,
            x: d.x,
            y: Math.max(0, adjustedHeight - current - height),
            color: getColor(d, ii, key),
            value
          }
        current += height;
        return stack;
      })
      const data = {
        x: d.x,
        bar,
        left: i * barWidth,
        data: d,
        state: "not-exiting"
      }
      dataToRegister[d.x] = bar;
      return data;
    })

    registerData(id, dataToRegister, "bar-graph", props);

    return { barData: [...barData, ...exitingData] };
  }
  constructor(props) {
    super(props);

    this.state = {
      id: getUniqueId(),
      barData: []
    };

    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }
  onMouseEnter(e, x, data) {
    this.props.onMouseEnter(e, x, null, this.props.id, data);
  }
  onMouseMove(e, x) {
    this.props.onMouseMove(e, x, null, this.props.id);
  }
  render() {
    const {
      height,
      margin: { top, bottom, left },
      handleInteractions,
      onMouseLeave
    } = this.props;

    return (
      <g style={ { transform: `translate(${ left }px, ${ top }px)` } }
        onMouseLeave={ handleInteractions ? onMouseLeave : null }>
        {
          this.state.barData.map(({ bar, x, left, state }) =>
            <MemoBar key={ x.toString() } id={ x }
              handleInteractions={ handleInteractions }
              onMouseEnter={ this.onMouseEnter }
              onMouseMove={ this.onMouseMove }
              data={ bar }
              left={ left }
              svgHeight={ height - bottom - top }
              state={ state }/>
          )
        }
      </g>
    )
  }
}
export const BarGraph = DataManager(BarGraphBase, "x");
// export const BarGraph = BarGraphBase;

class Stack extends React.PureComponent {
  ref = React.createRef()
  componentDidMount() {
    const { height, y, width, svgHeight, color } = this.props;
    d3.select(this.ref.current)
      .attr("width", width)
      .attr("height", 0)
      .attr("y", svgHeight)
      .transition().duration(1000)
      .attr("height", height)
      .attr("y", y)
      .attr("fill", color);
  }
  componentDidUpdate(oldProps) {
    const { y, height, width, state, svgHeight, color } = this.props;
    // if (state === "updating") {
    if (state !== "exiting") {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("height", height)
        .attr("y", y)
        .attr("width", width)
        .attr("fill", color);
    }
    else if (state === "exiting") {
      d3.select(this.ref.current)
        .transition().duration(1000)
        .attr("height", 0)
        .attr("y", svgHeight)
    }
  }
  render() {
    const {
      x,
      id,
      handleInteractions,
      onMouseEnter,
      onMouseMove,
      ...rest
    } = this.props;
    return <rect ref={ this.ref }
      onMouseEnter={ handleInteractions ? e => onMouseEnter(e, x, { x, key: id, ...rest }) : null }
      onMouseMove={ handleInteractions ? e => onMouseMove(e, x) : null }/>
  }
}
class Bar extends React.Component {
  ref = React.createRef();
  componentDidMount() {
    d3.select(this.ref.current)
      .attr("transform", `translate(${ this.props.left } 0)`)
  }
  componentDidUpdate() {
    if (this.props.state === "exiting") return;
    d3.select(this.ref.current)
      .transition().duration(1000)
      .attr("transform", `translate(${ this.props.left } 0)`)
  }
  render() {
    const {
      data,
      svgHeight,
      state,
      handleInteractions,
      onMouseEnter,
      onMouseMove
    } = this.props;
    return (
      <g ref={ this.ref }>
        { data.map(({ key, ...rest }) =>
            <Stack { ...rest } key={ key } id={ key }
              state={ state } svgHeight={ svgHeight }
              handleInteractions={ handleInteractions }
              onMouseEnter={ onMouseEnter }
              onMouseMove={ onMouseMove }/>
          )
        }
      </g>
    )
  }
}
const MemoBar = React.memo(Bar, deepequal);

export const generateTestBarData = (bars = 50, stacks = 5) => {
  const data = [];
  const magnitude = (Math.random() * 500 + 250) / stacks,
    shift = magnitude * .25;
  d3.range(bars).forEach(b => {
    const bar = {
      x: `key-${ b }`
    }
    d3.range(stacks).forEach(s => {
      bar[`stack-${ s }`] = magnitude + (Math.random() * shift) - shift * 2;
    })
    data.push(bar);
  })
  return data;
}
