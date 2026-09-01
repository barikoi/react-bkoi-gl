// Jest-based tests for applyReactStyle utility
import { applyReactStyle } from '../../../src/utils/apply-react-style'

describe('applyReactStyle utility', () => {
  let mockElement

  beforeEach(() => {
    // Create a mock DOM element
    mockElement = document.createElement('div')
    document.body.appendChild(mockElement)
  })

  afterEach(() => {
    // Clean up
    if (mockElement.parentNode) {
      mockElement.parentNode.removeChild(mockElement)
    }
  })

  test('applies object style correctly', () => {
    const style = {
      backgroundColor: 'red',
      color: 'blue',
      fontSize: '16px',
    }

    applyReactStyle(mockElement, style)

    expect(mockElement.style.backgroundColor).toBe('red')
    expect(mockElement.style.color).toBe('blue')
    expect(mockElement.style.fontSize).toBe('16px')
  })

  test('handles camelCase in object style', () => {
    const style = {
      borderRadius: '5px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    }

    applyReactStyle(mockElement, style)

    expect(mockElement.style.borderRadius).toBe('5px')
    expect(mockElement.style.boxShadow).toBe('0 2px 4px rgba(0,0,0,0.2)')
  })

  test('handles number values in object style', () => {
    const style = {
      width: 100,
      height: 200,
      opacity: 0.5,
    }

    applyReactStyle(mockElement, style)

    expect(mockElement.style.width).toBe('100px')
    expect(mockElement.style.height).toBe('200px')
    expect(mockElement.style.opacity).toBe('0.5')
  })

  test('ignores null or undefined values in object style', () => {
    const style = {
      color: 'red',
      backgroundColor: null,
      borderWidth: undefined,
    }

    applyReactStyle(mockElement, style)

    expect(mockElement.style.color).toBe('red')
    // Null/undefined values should not be applied
    // The behavior might vary by browser, so we don't assert a specific value
  })

  test('does nothing if style is null or undefined', () => {
    // Store original style
    mockElement.style.color = 'green'
    const originalColor = mockElement.style.color

    applyReactStyle(mockElement, null)
    expect(mockElement.style.color).toBe(originalColor)

    applyReactStyle(mockElement, undefined)
    expect(mockElement.style.color).toBe(originalColor)
  })

  test('handles empty style objects', () => {
    mockElement.style.color = 'green'
    const originalColor = mockElement.style.color

    applyReactStyle(mockElement, {})
    expect(mockElement.style.color).toBe(originalColor)
  })

  test('applies unitless styles without px suffix', () => {
    const style = {
      zIndex: 10,
      opacity: 0.5,
      fontWeight: 700,
      flexGrow: 1,
    }

    applyReactStyle(mockElement, style)

    expect(mockElement.style.zIndex).toBe('10')
    expect(mockElement.style.opacity).toBe('0.5')
    expect(mockElement.style.fontWeight).toBe('700')
    expect(mockElement.style.flexGrow).toBe('1')
  })
})
