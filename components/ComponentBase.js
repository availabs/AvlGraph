import React from "react"

import deepequal from "deep-equal"

import { getColorRange } from "constants/color-ranges"
const DEFAULT_COLORS = getColorRange(12, "Set3");

let ID_COUNTER = 0;
export const getUniqueId = () => `component-${ ++ID_COUNTER }`;

const noDomain = () => null;

export default class ComponentBase extends React.Component {
  static generateDefaultProps = newProps => ({
    data: [],
    colors: DEFAULT_COLORS,
    getDomainX: noDomain,
    getDomainY: noDomain,
    secondary: false,
    ...newProps
  })
  group = React.createRef()
  renderSvgDefs() {
    return null;
  }
  render() {
    return (
      <g ref={ this.group } id={ this.props.id }>
        { this.renderSvgDefs() }
      </g>
    )
  }
}

export class AxisBase extends ComponentBase {
  static defaultProps = ComponentBase.generateDefaultProps({
    label: "",
    showGridLines: true,
    ticks: 10,
    tickValues: []
  })
  componentDidMount() {
    this.updateAxis();
  }
  shouldComponentUpdate(nextProps) {
    return !deepequal(nextProps, this.props);
  }
  componentDidUpdate(oldProps) {
    this.updateAxis(oldProps.yDomain);
  }
  updateAxis(oldDomain = []) {
  }
}

export const getColorFunc = ({ colors }) => {
  let colorRange = [...DEFAULT_COLORS];
  if (typeof colors === "string") {
    const [k1, k2, reverse = false] = colors.split("-");
    colorRange = getColorRange(k1, k2);
    reverse && colorRange.reverse();
  }
  if (typeof colors === "function") {
    return colors;
  }
  const getColor = (d, i, k) => {
    if (typeof colors === "string") {
      return colorRange[i % colorRange.length];
    }
    return colors[i % colors.length];
  }
  return getColor;
}
