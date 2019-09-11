import React from "react"

import get from "lodash.get"

export class Group extends React.Component {
  static defaultProps = {
    data: [],
    getDomainX: () => null,
    getDomainY: () => null
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

    return { xDomain, yDomain };
  }

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
      registerData
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
        ...child.props,
        margin,
        handleInteractions,
        onMouseEnter,
        onMouseMove,
        onMouseLeave,
        transitionTime,
        registerData,
        secondary: true
      };
      return React.cloneElement(child, newProps);
    });
  }
  render() {
    return (
      <>
        { this.renderChildren() }
      </>
    )
  }
}
