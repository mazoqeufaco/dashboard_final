// ============================================
// COMPATIBILITY POLYFILLS FOR BROWSER SUPPORT
// ============================================

// Polyfill para URL.createObjectURL e URL.revokeObjectURL (IE11 e navegadores antigos)
(function() {
  'use strict';
  
  if (!window.URL) {
    window.URL = {};
  }
  
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = function(blob) {
      // Tenta webkitURL primeiro (Safari antigo)
      if (window.webkitURL && typeof window.webkitURL.createObjectURL === 'function') {
        return window.webkitURL.createObjectURL(blob);
      }
      // Fallback para navegadores muito antigos - cria uma URL de dados
      if (blob instanceof Blob) {
        try {
          // Tenta usar FileReader como último recurso
          var reader = new FileReader();
          var dataUrl = null;
          reader.onloadend = function() {
            dataUrl = reader.result;
          };
          reader.readAsDataURL(blob);
          // Nota: isso é assíncrono, então não é ideal, mas é o melhor que podemos fazer
          // Em navegadores muito antigos, pode ser necessário usar uma abordagem diferente
          return '#blob-fallback';
        } catch(e) {
          return '#';
        }
      }
      return '#';
    };
  }
  
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = function(url) {
      if (window.webkitURL && window.webkitURL.revokeObjectURL) {
        return window.webkitURL.revokeObjectURL(url);
      }
      // Fallback silencioso
      try {
        if (url && url.startsWith('blob:')) {
          // Tenta revogar se possível
        }
      } catch(e) {
        // Ignora erros
      }
    };
  }
})();

// Polyfill para fetch API (IE11 e navegadores antigos)
(function() {
  'use strict';
  
  if (!window.fetch) {
    window.fetch = function(url, options) {
      return new Promise(function(resolve, reject) {
        var xhr = new XMLHttpRequest();
        var method = (options && options.method) || 'GET';
        var headers = (options && options.headers) || {};
        var body = options && options.body;
        
        xhr.open(method, url, true);
        
        // Define headers
        Object.keys(headers).forEach(function(key) {
          xhr.setRequestHeader(key, headers[key]);
        });
        
        xhr.onload = function() {
          var response = {
            ok: xhr.status >= 200 && xhr.status < 300,
            status: xhr.status,
            statusText: xhr.statusText,
            headers: {
              get: function(name) {
                return xhr.getResponseHeader(name);
              }
            },
            text: function() {
              return Promise.resolve(xhr.responseText);
            },
            json: function() {
              try {
                return Promise.resolve(JSON.parse(xhr.responseText));
              } catch(e) {
                return Promise.reject(e);
              }
            },
            blob: function() {
              return Promise.resolve(new Blob([xhr.response], { type: xhr.getResponseHeader('Content-Type') || 'application/octet-stream' }));
            }
          };
          
          if (response.ok) {
            resolve(response);
          } else {
            reject(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
          }
        };
        
        xhr.onerror = function() {
          reject(new Error('Network error'));
        };
        
        if (body) {
          xhr.send(body);
        } else {
          xhr.send();
        }
      });
    };
  }
})();

// Polyfill para Promise (IE11)
(function() {
  'use strict';
  
  if (typeof Promise === 'undefined') {
    window.Promise = function(executor) {
      var self = this;
      self.state = 'pending';
      self.value = undefined;
      self.handlers = [];
      
      function resolve(result) {
        if (self.state === 'pending') {
          self.state = 'fulfilled';
          self.value = result;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function reject(error) {
        if (self.state === 'pending') {
          self.state = 'rejected';
          self.value = error;
          self.handlers.forEach(handle);
          self.handlers = null;
        }
      }
      
      function handle(handler) {
        if (self.state === 'pending') {
          self.handlers.push(handler);
        } else {
          if (self.state === 'fulfilled' && typeof handler.onFulfilled === 'function') {
            handler.onFulfilled(self.value);
          }
          if (self.state === 'rejected' && typeof handler.onRejected === 'function') {
            handler.onRejected(self.value);
          }
        }
      }
      
      this.then = function(onFulfilled, onRejected) {
        return new Promise(function(resolve, reject) {
          handle({
            onFulfilled: function(result) {
              try {
                resolve(onFulfilled ? onFulfilled(result) : result);
              } catch(ex) {
                reject(ex);
              }
            },
            onRejected: function(error) {
              try {
                resolve(onRejected ? onRejected(error) : error);
              } catch(ex) {
                reject(ex);
              }
            }
          });
        });
      };
      
      this.catch = function(onRejected) {
        return this.then(null, onRejected);
      };
      
      try {
        executor(resolve, reject);
      } catch(ex) {
        reject(ex);
      }
    };
    
    Promise.resolve = function(value) {
      return new Promise(function(resolve) {
        resolve(value);
      });
    };
    
    Promise.reject = function(reason) {
      return new Promise(function(resolve, reject) {
        reject(reason);
      });
    };
  }
})();

// Polyfill para dialog element (navegadores antigos)
(function() {
  'use strict';
  
  // Testa se dialog é suportado nativamente
  var testDialog = document.createElement('dialog');
  var isDialogSupported = typeof testDialog.showModal === 'function';
  
  if (!isDialogSupported) {
    var dialogPolyfill = {
      init: function() {
        var dialogs = document.querySelectorAll('dialog');
        for (var i = 0; i < dialogs.length; i++) {
          var dialog = dialogs[i];
          
          // Adiciona métodos se não existirem
          if (typeof dialog.showModal !== 'function') {
            dialog.showModal = function() {
              this.style.display = 'block';
              this.setAttribute('open', '');
              
              // Cria backdrop se não existir
              var backdropId = 'dialog-backdrop-' + (this.id || Math.random().toString(36).substr(2, 9));
              this.setAttribute('data-backdrop-id', backdropId);
              
              var backdrop = document.createElement('div');
              backdrop.id = backdropId;
              backdrop.className = 'dialog-backdrop';
              backdrop.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.75); z-index: 9998;';
              document.body.appendChild(backdrop);
              
              // Estilo do dialog
              var currentStyle = this.getAttribute('style') || '';
              this.style.cssText = currentStyle + '; position: fixed; top: 50%; left: 50%; -webkit-transform: translate(-50%, -50%); -ms-transform: translate(-50%, -50%); transform: translate(-50%, -50%); z-index: 9999;';
              
              var self = this;
              backdrop.addEventListener('click', function() {
                self.close();
              });
            };
            
            dialog.close = function() {
              this.style.display = 'none';
              this.removeAttribute('open');
              var backdropId = this.getAttribute('data-backdrop-id');
              if (backdropId) {
                var backdrop = document.getElementById(backdropId);
                if (backdrop) {
                  backdrop.remove();
                }
                this.removeAttribute('data-backdrop-id');
              }
            };
          }
        }
      }
    };
    
    // Inicializa quando o DOM estiver pronto
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', dialogPolyfill.init);
    } else {
      dialogPolyfill.init();
    }
    
    // Re-inicializa quando novos dialogs forem adicionados (MutationObserver para navegadores modernos)
    if (typeof MutationObserver !== 'undefined') {
      var observer = new MutationObserver(function(mutations) {
        var hasNewDialogs = false;
        mutations.forEach(function(mutation) {
          if (mutation.addedNodes) {
            for (var i = 0; i < mutation.addedNodes.length; i++) {
              var node = mutation.addedNodes[i];
              if (node.nodeType === 1 && (node.tagName === 'DIALOG' || node.querySelectorAll('dialog').length > 0)) {
                hasNewDialogs = true;
                break;
              }
            }
          }
        });
        if (hasNewDialogs) {
          dialogPolyfill.init();
        }
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  }
})();

// Polyfill para Object.assign (IE11)
(function() {
  'use strict';
  
  if (typeof Object.assign !== 'function') {
    Object.assign = function(target) {
      if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
      }
      
      var to = Object(target);
      
      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];
        
        if (nextSource != null) {
          for (var nextKey in nextSource) {
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    };
  }
})();

// Polyfill para Array.includes (IE11)
if (!Array.prototype.includes) {
  Array.prototype.includes = function(searchElement, fromIndex) {
    if (this == null) {
      throw new TypeError('"this" is null or not defined');
    }
    
    var o = Object(this);
    var len = parseInt(o.length) || 0;
    
    if (len === 0) {
      return false;
    }
    
    var n = parseInt(fromIndex) || 0;
    var k;
    
    if (n >= 0) {
      k = n;
    } else {
      k = len + n;
      if (k < 0) {
        k = 0;
      }
    }
    
    function sameValueZero(x, y) {
      return x === y || (typeof x === 'number' && typeof y === 'number' && isNaN(x) && isNaN(y));
    }
    
    for (; k < len; k++) {
      if (sameValueZero(o[k], searchElement)) {
        return true;
      }
    }
    
    return false;
  };
}

// Polyfill para String.includes (IE11)
if (!String.prototype.includes) {
  String.prototype.includes = function(search, start) {
    if (typeof start !== 'number') {
      start = 0;
    }
    
    if (start + search.length > this.length) {
      return false;
    } else {
      return this.indexOf(search, start) !== -1;
    }
  };
}

// Polyfill para String.startsWith (IE11)
if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.substr(position, searchString.length) === searchString;
  };
}

console.log('✅ Compatibility polyfills loaded');

