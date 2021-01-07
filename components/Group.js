import React from "react"

import get from "lodash.get"

import { generateDomains } from "./utils"

export class Group extends React.Component {
  static defaultProps = {
    getDomainX: () => null,
    getDomainY: () => null
  }
  static getDerivedStateFromProps = generateDomains

  state = {
    xDomain: [],
    yDomain: []
  }
  renderChildren() {
    const {
      xDomain,
      yDomain
    } = this.state;
    const {
      width,
      height,
      transitionTime,
      margin,
      idFormat,
      xFormat,
      yFormat,
      handleInteractions,
      onMouseEnter,
      onMouseMove,
      onMouseLeave,
      registerData,
      padding,
      secondary
    } = this.props;

    if ((width === 0) || (height === 0)) return null;

    return React.Children.map(this.props.children, child => {
      const newProps = {
        idFormat,
        xFormat,
        yFormat,
        width,
        height,
        yDomain,
        xDomain,
        padding,

        ...child.props,

        secondary,
        margin,
        handleInteractions,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        transitionTime,
        registerData
      };
      return React.cloneElement(child, newProps);
    });
  }
  render() {
    return (
      <g>
        { this.renderChildren() }
      </g>
    )
  }
}
