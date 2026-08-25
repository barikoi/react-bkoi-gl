// Jest-based tests for setGlobals utility
import setGlobals from '../../src/utils/set-globals';

describe('setGlobals utility', () => {
  let mockMapLib;
  let errorSpy;
  
  beforeEach(() => {
    // Create mock mapLib with RTL plugin functionality
    mockMapLib = {
      getRTLTextPluginStatus: vi.fn().mockReturnValue('unavailable'),
      setRTLTextPlugin: vi.fn((url, callback, lazy) => {
        if (url === 'error-url') {
          callback(new Error('Plugin error'));
        } else {
          callback();
        }
      }),
      setMaxParallelImageRequests: vi.fn(),
      setWorkerCount: vi.fn(),
      setWorkerUrl: vi.fn()
    };
    
    // Spy on console.error
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    errorSpy.mockRestore();
  });
  
  test('sets RTLTextPlugin with string URL', () => {
    const props = {
      RTLTextPlugin: 'https://example.com/rtl-plugin.js'
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.getRTLTextPluginStatus).toHaveBeenCalled();
    expect(mockMapLib.setRTLTextPlugin).toHaveBeenCalledWith(
      'https://example.com/rtl-plugin.js',
      expect.any(Function),
      true // Default lazy loading
    );
  });
  
  test('sets RTLTextPlugin with object config', () => {
    const props = {
      RTLTextPlugin: {
        pluginUrl: 'https://example.com/rtl-plugin.js',
        lazy: false
      }
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.setRTLTextPlugin).toHaveBeenCalledWith(
      'https://example.com/rtl-plugin.js',
      expect.any(Function),
      false // Explicitly not lazy loading
    );
  });
  
  test('logs error when RTLTextPlugin loading fails', () => {
    const props = {
      RTLTextPlugin: 'https://example.com/rtl-plugin.js'
    };
    
    setGlobals(mockMapLib, props);
    
    // Extract the callback from the call
    const callback = mockMapLib.setRTLTextPlugin.mock.calls[0][1];
    callback(new Error('Plugin error'));
    
    expect(errorSpy).toHaveBeenCalledWith(expect.any(Error));
  });
  
  test('does not set RTLTextPlugin if status is not unavailable', () => {
    mockMapLib.getRTLTextPluginStatus.mockReturnValue('loaded');
    
    const props = {
      RTLTextPlugin: 'https://example.com/rtl-plugin.js'
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.getRTLTextPluginStatus).toHaveBeenCalled();
    expect(mockMapLib.setRTLTextPlugin).not.toHaveBeenCalled();
  });
  
  test('does not set RTLTextPlugin if not provided', () => {
    const props = {
      maxParallelImageRequests: 10
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.setRTLTextPlugin).not.toHaveBeenCalled();
  });
  
  test('sets maxParallelImageRequests when provided', () => {
    const props = {
      maxParallelImageRequests: 10
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.setMaxParallelImageRequests).toHaveBeenCalledWith(10);
  });
  
  test('sets workerCount when provided', () => {
    const props = {
      workerCount: 4
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.setWorkerCount).toHaveBeenCalledWith(4);
  });
  
  test('sets workerUrl when provided', () => {
    const props = {
      workerUrl: 'https://example.com/worker.js'
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.setWorkerUrl).toHaveBeenCalledWith('https://example.com/worker.js');
  });
  
  test('sets multiple properties when provided', () => {
    const props = {
      RTLTextPlugin: 'https://example.com/rtl-plugin.js',
      maxParallelImageRequests: 10,
      workerCount: 4,
      workerUrl: 'https://example.com/worker.js'
    };
    
    setGlobals(mockMapLib, props);
    
    expect(mockMapLib.setRTLTextPlugin).toHaveBeenCalled();
    expect(mockMapLib.setMaxParallelImageRequests).toHaveBeenCalledWith(10);
    expect(mockMapLib.setWorkerCount).toHaveBeenCalledWith(4);
    expect(mockMapLib.setWorkerUrl).toHaveBeenCalledWith('https://example.com/worker.js');
  });

  test('warns when RTLTextPlugin is configured but mapLib lacks setRTLTextPlugin', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const mapLibWithoutRTL = {
      getRTLTextPluginStatus: vi.fn().mockReturnValue('unavailable'),
      // setRTLTextPlugin intentionally omitted
      setMaxParallelImageRequests: vi.fn(),
      setWorkerCount: vi.fn(),
      setWorkerUrl: vi.fn()
    };

    setGlobals(mapLibWithoutRTL, {
      RTLTextPlugin: 'https://example.com/rtl-plugin.js'
    });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('setRTLTextPlugin'));
    warnSpy.mockRestore();
  });
});
describe('URL validation', () => {
  let warnSpy;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  const makeMapLib = () => ({
    getRTLTextPluginStatus: vi.fn().mockReturnValue('unavailable'),
    setRTLTextPlugin: vi.fn(),
    setMaxParallelImageRequests: vi.fn(),
    setWorkerCount: vi.fn(),
    setWorkerUrl: vi.fn()
  });

  test('rejects RTLTextPlugin URLs with non-http protocols', () => {
    const mapLib = makeMapLib();

    setGlobals(mapLib, { RTLTextPlugin: 'javascript:alert(1)' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Only http/https protocols are allowed')
    );
    expect(mapLib.setRTLTextPlugin).not.toHaveBeenCalled();
  });

  test('rejects malformed RTLTextPlugin URLs', () => {
    const mapLib = makeMapLib();

    setGlobals(mapLib, { RTLTextPlugin: 'not a url' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid URL format')
    );
    expect(mapLib.setRTLTextPlugin).not.toHaveBeenCalled();
  });

  test('rejects workerUrl with non-http protocol and skips setWorkerUrl', () => {
    const mapLib = makeMapLib();

    setGlobals(mapLib, { workerUrl: 'ftp://example.com/worker.js' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('workerUrl')
    );
    expect(mapLib.setWorkerUrl).not.toHaveBeenCalled();
  });

  test('rejects malformed workerUrl and skips setWorkerUrl', () => {
    const mapLib = makeMapLib();

    setGlobals(mapLib, { workerUrl: '' });

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid URL format')
    );
    expect(mapLib.setWorkerUrl).not.toHaveBeenCalled();
  });
});
