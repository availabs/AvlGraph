import React from "react"
import ReactDOM from 'react-dom'

import deepequal from "deep-equal"
import get from "lodash.get"
import styled from "styled-components"

import d3 from "./components/d3"

import "./AvlGraph.css"

const DEFAULT_MARGIN = { top: 20, right: 20, bottom: 20, left: 20 };

const TRANSITION_SCALE = d3.scaleLinear()
  .domain([5, 250])
  .range([0.1, 0.25]);

let ID_COUNTER = 0;
export default class AvlGraph extends React.Component {
  static defaultProps = {
    id: `avl-graph-${ ++ID_COUNTER }`,
    margin: { ...DEFAULT_MARGIN },
    xFormat: x => x,
    yFormat: y => y,
    idFormat: id => id,
    renderInteractiveLayer: false
  }

  static getDerivedStateFromProps = (props, state) => {
    let xDomain = [],
      childDomains = [],
      yDomain = [];

    React.Children.forEach(props.children, child => {
      const { data, getDomainX, getDomainY, keys } = child.props,
        xd = getDomainX(data),
        yd = getDomainY(data, keys);
      if (xd !== null) {
        childDomains.push(xd);
      }
      if (yd !== null) {
        const [y1, y2] = yd;
        yDomain = [0, Math.max(y2, get(yDomain, [1], 0))]
      }
    })
    xDomain = childDomains.reduce((a, c) => {
      return a.length > c.length ? a : a.length < c.length ? c : a;
    }, []);

    const {
      width,
      height
    } = state;

    const transitionTime = TRANSITION_SCALE(width / xDomain.length);

    return { xDomain, yDomain, transitionTime };
  }

  constructor(props) {
    super(props);

    this.state = {
      width: 0,
      height: 0,
      showHover: false,
      hoverPos: [0, 0],
      hoverData: {},
      xDomain: [],
      yDomain: [],
      groups: [],
      transitionTime: 0.15,
      padding: 0.5
    }
    this.registerData = this.registerData.bind(this);
    this.onMouseEnter = this.onMouseEnter.bind(this);
    this.onMouseLeave = this.onMouseLeave.bind(this);
    this.onMouseMove = this.onMouseMove.bind(this);
  }

  componentData = {}

  container = null;
  svg = null;

  componentDidMount() {
    this.setSize();
  }
  componentDidUpdate() {
    this.setSize();
  }
  setSize() {
    if (Boolean(this.svg)) {
      const width = this.svg.clientWidth,
        height = this.svg.clientHeight;
      if ((width !== this.state.width) || (height !== this.state.height)) {
        this.setState({ width, height });
      }
    }
  }
  renderChildren() {
    const {
      width,
      height,
      xDomain,
      yDomain,
      transitionTime
    } = this.state;

    if ((width === 0) || (height === 0)) return null;

    return React.Children.map(this.props.children, child => {
      const newProps = {
        idFormat: this.props.idFormat,
        xFormat: this.props.xFormat,
        yFormat: this.props.yFormat,
        width,
        height,
        registerData: this.registerData,
        yDomain,
        xDomain,
        padding: this.props.padding,
        ...child.props,
        margin: this.getMargin(),
        handleInteractions: !this.props.renderInteractiveLayer,
        onMouseEnter: this.onMouseEnter,
        onMouseMove: this.onMouseMove,
        onMouseLeave: this.onMouseLeave,
        transitionTime
      };
console.log("NEW PROPS:", newProps.padding, this.props.padding)
      return React.cloneElement(child, newProps);
    });
  }
  renderInteractiveLayer() {
    const {
        width,
        height,
        xDomain,
        yDomain,
        transitionTime
      } = this.state,
      { top, right, bottom, left } = this.getMargin(),
      { renderInteractiveLayer, padding } = this.props;

    const xScale = d3.scalePoint()
      .domain(xDomain)
      .range([0, width - left - right])
      .padding(padding)

    const test = d3.scaleLinear()
      .domain([0, 0.5])
      .range([0.5, 0])

console.log("PADDING:", padding)
    return !renderInteractiveLayer ? null : (
      <g className="interactive-layer"
        style={ { transform: `translate(${ left }px, ${ top }px)` } }
        onMouseLeave={ e => this.onMouseLeave(e) }>

        {
          xDomain.map((x, i) =>
            <rect key={ x }
              x={ i * xScale.step() - xScale.step() * test(padding) }
              width={ xScale.step() }
              height={ Math.max(height - top - bottom, 0) }
              fill="none"
              pointerEvents="all"
              onMouseEnter={ e => this.onMouseEnter(e, x, xScale(x)) }
              onMouseMove={ e => this.onMouseMove(e, x, xScale(x)) }/>
          )
        }

        <line y1="0" y2={ height - top - bottom }
          pointerEvents="none"
          stroke={ this.state.showHover ? "#000" : "none" }/>
      </g>
    )
  }
  getHoverComps() {
    if (!this.state.showHover) return [];

    return Object.keys(this.state.hoverData)
      .reduce((comps, id) => {
        const {
          HoverComp,
          idFormat,
          xFormat,
          yFormat,
          secondary
        } = this.componentData[id];
        comps.push(
          <HoverComp key={ id }
            data={ this.state.hoverData[id] }
            idFormat={ idFormat }
            xFormat={ xFormat }
            yFormat={ yFormat }
            secondary={ secondary }/>
        );
        return comps;
      }, [])
  }
  onMouseEnter(e, x, xpos, id, data) {
    const rect = this.svg.getBoundingClientRect(),
      _xpos = e.clientX - rect.left - this.svg.clientLeft,
      y = e.clientY - rect.top - this.svg.clientTop;
    // [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];

    const { width, height } = this.state,
      { top, right, bottom, left } = this.getMargin();

    xpos = xpos === null ? _xpos : +xpos + left;

    if (!this.props.renderInteractiveLayer) {
      if ((data.key !== get(this.state.hoverData, [id, "key"], false) ||
          data.x !== get(this.state.hoverData, [id, "x"]))) {
        this.setHoverData(id, data);
      }
    }

    d3.select(this.svg)
      .select(".interactive-layer")
      .select("line")
      .style("transform", `translate(${ xpos - left + 0.5 }px, 0px)`);

    this.setState({ showHover: true, hoverPos: [xpos, y] });
  }
  onMouseLeave(e) {
    this.setState({ showHover: false });

    d3.select(this.svg)
      .select(".interactive-layer")
      .select("line")
      .style("transition", null);
  }
  onMouseMove(e, x, xpos, id) {
    const rect = this.svg.getBoundingClientRect(),
      _xpos = e.clientX - rect.left - this.svg.clientLeft,
      y = e.clientY - rect.top - this.svg.clientTop;

    const { width, height } = this.state,
      { top, right, bottom, left } = this.getMargin();

    xpos = xpos === null ? _xpos : +xpos + left;

    const yInverted = (height - bottom) - y;

    if (this.props.renderInteractiveLayer) {
      for (const id in this.componentData) {
        const compData = this.componentData[id];
        switch (compData.type) {
          case "bar-graph": {
            const data = compData.data[x];
            let current = 0,
              stack = null;
            for (const d of data) {
              if ((yInverted >= current) && (yInverted <= (current + d.height))) {
                stack = d;
                break;
              }
              current += d.height;
            }
            if (stack &&
              (stack.key !== get(this.state.hoverData, [id, "key"], false) ||
              stack.x !== get(this.state.hoverData, [id, "x"]))
            ) {
              this.setHoverData(id, stack);
            }
            else if (!stack) {
              this.setHoverData(id);
            }
            break;
          } // END case "bar-graph"
          case "line-graph": {
            const compData = this.componentData[id].data[x];
            if (compData.x !== get(this.state.hoverData, [id, "x"], false)) {
              this.setHoverData(id, compData);
            }
            break;
          } // END case "line-graph"
        }
      }
    }

    d3.select(this.svg)
      .select(".interactive-layer")
      .select("line")
      .style("transform", `translate(${ xpos - left + 0.5 }px, 0px)`)
      .style("transition", `transform ${ this.state.transitionTime }s`);

    this.setState({ hoverPos: [xpos, y] });
  }

  setHoverData(id, data = null) {
    const hoverData = { ...this.state.hoverData };
    if (data) {
      hoverData[id] = data;
      this.setState({ hoverData });
    }
    else if ((data === null) && (id in hoverData)) {
      delete hoverData[id];
      this.setState({ hoverData });
    }
  }

  registerData(id, data, type, props) {
    const {
      HoverComp,
      idFormat,
      xFormat,
      yFormat,
      secondary
    } = props;

    this.componentData[id] = {
      data,
      type,
      HoverComp,
      idFormat,
      xFormat,
      yFormat,
      secondary
    };
  }

  getMargin() {
    return { ...DEFAULT_MARGIN, ...this.props.margin };
  }

  render() {
    const { width, height, hoverPos, transitionTime } = this.state,
      { top, right, bottom, left } = this.getMargin(),
      hoverComps = this.getHoverComps();

    return (
      <Container ref={ comp => this.container = comp }>
        <SVG ref={ comp => this.svg = comp }
          className="avl-graph">

          { this.renderChildren() }

          { this.renderInteractiveLayer() }

        </SVG>

        <HoverComp
          transitionTime={ transitionTime }
          hoverComps={ hoverComps }
          bounds={ [width - right, height - bottom] }
          pos={ hoverPos }/>

      </Container>
    )
  }
}
const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
`
const SVG = styled.svg`
  width: 100%;
  height: 100%;
  display: block;
`
const HoverContainer = styled.div`
  position: absolute;
  pointer-events: none;
  padding: 5px 10px 10px 10px;
  white-space: nowrap;
  border-radius: 4px;
  box-shadow: -1px -1px 2px 0 rgba(0, 0, 0, 0.1), 3px 3px 6px 0 rgba(0, 0, 0, 0.2);
`

class HoverComp extends React.Component {
  hover = null;
  state = {
    width: 0,
    height: 0,
    startTransitioning: false
  }
  componentDidMount() {
    this.setSize();
  }
  componentDidUpdate() {
    this.setSize();

    if (!this.props.hoverComps.length && this.state.startTransitioning) {
      this.setState({ startTransitioning: false });
    }
  }
  setSize() {
    if (!this.hover) return;

    const width = this.hover.clientWidth,
      height = this.hover.clientHeight;

    if ((width !== this.state.width) || (height !== this.state.height)) {
      this.setState({ width, height });
    }

    if ((width !== 0) && !this.state.startTransitioning) {
      setTimeout(() => this.setState({ startTransitioning: true }), 10)
    }
  }

  getPosition() {
    const {
        bounds: [maxX, maxY],
        pos: [x, y],
      } = this.props,

      { width, height } = this.state;

    let left = x + 10;
    if ((x + 10 + width) > (maxX - 10)) {
      left = x - 10 - width;
    }

    let top = y + 10;
    if ((y + 10 + height) > (maxY - 10)) {
      top = maxY - 10 - height;
    }

    return [left, top];
  }

  render() {
    const { hoverComps, transitionTime } = this.props;

    if (!hoverComps.length) return null;

    const { width, height, startTransitioning } = this.state;

    const [left, top] = this.getPosition();

    return (
      <HoverContainer ref={ comp => this.hover = comp }
        className="hover-comp"
        style={ {
          transition: `left ${ startTransitioning ? transitionTime : 0 }s, top ${ startTransitioning ? transitionTime : 0 }s`,
          left: `${ left }px`,
          top: `${ top }px`
        } }>
        { hoverComps }
      </HoverContainer>
    )
  }
}
