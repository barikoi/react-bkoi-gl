import {createRoot} from 'react-dom/client';

export function mount(component) {
  const root = document.createElement('div');
  document.body.appendChild(root);
  const reactRoot = createRoot(root);
  reactRoot.render(component);
  
  return {
    setProps: (newProps) => {
      reactRoot.render(React.cloneElement(component, newProps));
    },
    unmount: () => {
      reactRoot.unmount();
      document.body.removeChild(root);
    },
    getDOMNode: () => root
  };
}

export function createMapMock() {
  return {
    addControl: jest.fn(),
    removeControl: jest.fn(),
    getContainer: () => document.createElement('div')
  };
} 