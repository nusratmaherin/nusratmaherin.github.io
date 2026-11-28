// Compiles a dart2wasm-generated main module from `source` which can then
// be instantiated via the `instantiate` method.
//
// `source` needs to be a `Response` object (or promise thereof) e.g. created
// via the `fetch()` JS API.
export async function compileStreaming(source) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(
      await _compileStreaming(source, builtins), builtins);
}

// Compiles a dart2wasm-generated wasm module from `bytes` which is then
// instantiable via the `instantiate` method.
export async function compile(bytes) {
  const builtins = {builtins: ['js-string'], importedStringConstants: ''};
  return new CompiledApp(await WebAssembly.compile(bytes, builtins), builtins);
}

let _isCompileStreamingSupported;
async function _compileStreaming(source, builtins) {
  _isCompileStreamingSupported ??= WebAssembly.compileStreaming(
    new Response(
      new Uint8Array([0,97,115,109,1,0,0,0,1,4,1,96,0,0,2,23,1,14,119,97,115,109,58,106,115,45,115,116,114,105,110,103,4,99,97,115,116,0,0]),
      {headers: {'Content-Type': 'application/wasm'}},
    ),
    builtins,
  ).then(() => false, (e) => e instanceof WebAssembly.CompileError);
  if (await _isCompileStreamingSupported) {
    return WebAssembly.compileStreaming(source, builtins);
  }
  return WebAssembly.compile(await (await source).arrayBuffer(), builtins);
}

class CompiledApp {
  constructor(module, builtins) {
    this.module = module;
    this.builtins = builtins;
  }

  // The second argument is an options object containing:
  // `loadDeferredModules` is a JS function that takes an array of module names
  //   matching wasm files produced by the dart2wasm compiler. It also takes a
  //   callback that should be invoked for each loaded module with 2 arguments:
  //   (1) the module name, (2) the loaded module in a format supported by
  //   `WebAssembly.compile` or `WebAssembly.compileStreaming`. The callback
  //   returns a Promise that resolves when the module is instantiated.
  //   loadDeferredModules should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  // `loadDeferredId` is a JS function that takes load ID produced by the
  //   compiler when the `use-load-ids` option is passed. Each load ID maps to
  //   one or more wasm files as specified in the emitted JSON file. It also
  //   takes a callback that should be invoked for each loaded module with 2
  //   arguments: (1) the module name, (2) the loaded module in a format
  //   supported by `WebAssembly.compile` or `WebAssembly.compileStreaming`.
  //   The callback returns a Promise that resolves when the module is
  //   instantiated.
  //   loadDeferredId should return a Promise that resolves when all the
  //   modules have been loaded and the callback promises have resolved.
  async instantiate(additionalImports, {loadDeferredModules, loadDeferredId} = {}) {
    let dartInstance;

    // Prints to the console
    function printToConsole(value) {
      if (typeof dartPrint == "function") {
        dartPrint(value);
        return;
      }
      if (typeof console == "object" && typeof console.log != "undefined") {
        console.log(value);
        return;
      }
      if (typeof print == "function") {
        print(value);
        return;
      }

      throw "Unable to print message: " + value;
    }

    // A special symbol attached to functions that wrap Dart functions.
    const jsWrappedDartFunctionSymbol = Symbol("JSWrappedDartFunction");

    function finalizeWrapper(dartFunction, wrapped) {
      wrapped.dartFunction = dartFunction;
      wrapped[jsWrappedDartFunctionSymbol] = true;
      return wrapped;
    }

    // Imports
    const dart2wasm = {
            AB: x0 => new Int16Array(x0),
      AC: (o, start, length) => new Uint8Array(o.buffer, o.byteOffset + start, length),
      AD: (x0,x1,x2) => x0.addEventListener(x1,x2),
      AE: (o, i) => o[i],
      AF: x0 => x0.tiltY,
      AG: (x0,x1) => x0.querySelectorAll(x1),
      AH: (x0,x1) => x0.writeText(x1),
      AI: (a, i) => a.splice(i, 1),
      AJ: (x0,x1) => { x0.onerror = x1 },
      AK: (x0,x1) => x0.createElement(x1),
      AL: x0 => x0.localStorage,
      AM: x0 => x0.refreshToken,
      AN: x0 => x0.email,
      AO: x0 => x0.toUint8Array(),
      AP: x0 => globalThis.firebase_firestore.getDocFromCache(x0),
      AQ: () => globalThis._flutter,
      B: s => printToConsole(s),
      BB: x0 => new Uint16Array(x0),
      BC: (o, start, length) => new Int8Array(o.buffer, o.byteOffset + start, length),
      BD: (x0,x1,x2) => x0.setAttribute(x1,x2),
      BE: o => o.length,
      BF: x0 => x0.tiltX,
      BG: (x0,x1) => x0.requestAnimationFrame(x1),
      BH: x0 => x0.unlock(),
      BI: a => a.pop(),
      BJ: (x0,x1) => { x0.onload = x1 },
      BK: (x0,x1) => { x0.pointerEvents = x1 },
      BL: (x0,x1) => x0.getItem(x1),
      BM: x0 => x0.photoURL,
      BN: (x0,x1) => globalThis.firebase_auth.getMultiFactorResolver(x0,x1),
      BO: () => globalThis.firebase_firestore.Bytes,
      BP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      C: Function.prototype.call.bind(Number.prototype.toString),
      CB: x0 => new Int32Array(x0),
      CC: (x0,x1) => x0.querySelector(x1),
      CD: (x0,x1) => x0.closest(x1),
      CE: o => {
        if (o === undefined) return 1;
        var type = typeof o;
        if (type === 'boolean') return 2;
        if (type === 'number') return 3;
        if (type === 'string') return 4;
        if (o instanceof Array) return 5;
        if (ArrayBuffer.isView(o)) {
          if (o instanceof Int8Array) return 6;
          if (o instanceof Uint8Array) return 7;
          if (o instanceof Uint8ClampedArray) return 8;
          if (o instanceof Int16Array) return 9;
          if (o instanceof Uint16Array) return 10;
          if (o instanceof Int32Array) return 11;
          if (o instanceof Uint32Array) return 12;
          if (o instanceof Float32Array) return 13;
          if (o instanceof Float64Array) return 14;
          if (o instanceof DataView) return 15;
        }
        if (o instanceof ArrayBuffer) return 16;
        // Feature check for `SharedArrayBuffer` before doing a type-check.
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
            return 17;
        }
        if (o instanceof Promise) return 18;
        return 19;
      },
      CF: x0 => x0.pointerType,
      CG: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      CH: (x0,x1) => x0.lock(x1),
      CI: x0 => new WeakRef(x0),
      CJ: x0 => x0.responseText,
      CK: (x0,x1) => { x0.height = x1 },
      CL: (x0,x1,x2) => x0.setItem(x1,x2),
      CM: x0 => x0.phoneNumber,
      CN: x0 => x0.customData,
      CO: () => globalThis.firebase_firestore.VectorValue,
      CP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      D: Function.prototype.call.bind(BigInt.prototype.toString),
      DB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      DC: (x0,x1) => x0.item(x1),
      DD: (ms, c) =>
      setTimeout(() => dartInstance.exports.$invokeCallback(c),ms),
      DE: x0 => x0.language,
      DF: x0 => x0.pointerId,
      DG: x0 => x0.now(),
      DH: x0 => x0.orientation,
      DI: x0 => x0.deref(),
      DJ: x0 => x0.status,
      DK: (x0,x1) => { x0.width = x1 },
      DL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      DM: x0 => x0.lastSignInTime,
      DN: x0 => x0.message,
      DO: x0 => x0.longitude,
      DP: (x0,x1,x2) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2),
      E: (exn) => {
        let stackString = exn.toString();
        let frames = stackString.split('\n');
        let drop = 4;
        if (frames[0].startsWith('Error')) {
            drop += 1;
        }
        return frames.slice(drop).join('\n');
      },
      EB: x0 => new Uint32Array(x0),
      EC: x0 => x0.length,
      ED: (handle) => clearTimeout(handle),
      EE: (x0,x1,x2,x3) => x0.register(x1,x2,x3),
      EF: x0 => x0.getCoalescedEvents(),
      EG: x0 => x0.performance,
      EH: (x0,x1) => x0.querySelector(x1),
      EI: () => globalThis.WeakRef,
      EJ: (x0,x1) => { x0.onprogress = x1 },
      EK: x0 => x0.style,
      EL: x0 => x0.preventDefault(),
      EM: x0 => x0.creationTime,
      EN: x0 => x0.code,
      EO: x0 => x0.latitude,
      EP: (x0,x1,x2) => globalThis.firebase_firestore.setDoc(x0,x1,x2),
      F: () => new Error().stack,
      FB: x0 => new Float32Array(x0),
      FC: (x0,x1) => x0.querySelectorAll(x1),
      FD: x0 => x0.maxTouchPoints,
      FE: () => globalThis.window.FinalizationRegistry,
      FF: s => s.trimLeft(),
      FG: (d, digits) => d.toFixed(digits),
      FH: (x0,x1) => { x0.title = x1 },
      FI: (o, offsetInBytes, lengthInBytes) => {
        var dst = new ArrayBuffer(lengthInBytes);
        new Uint8Array(dst).set(new Uint8Array(o, offsetInBytes, lengthInBytes));
        return new DataView(dst);
      },
      FJ: x0 => x0.total,
      FK: (x0,x1) => { x0.src = x1 },
      FL: x0 => x0.files,
      FM: x0 => x0.metadata,
      FN: x0 => x0.code,
      FO: () => globalThis.firebase_firestore.GeoPoint,
      FP: (x0,x1) => globalThis.firebase_firestore.setDoc(x0,x1),
      G: s => JSON.stringify(s),
      GB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF32ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      GC: (x0,x1) => x0.getAttribute(x1),
      GD: x0 => x0.platform,
      GE: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      GF: (x0,x1) => x0[x1],
      GG: x0 => x0.maxHeight,
      GH: (x0,x1) => x0.vibrate(x1),
      GI: (a, s, e) => a.slice(s, e),
      GJ: x0 => x0.loaded,
      GK: () => globalThis.document,
      GL: x0 => x0.dataTransfer,
      GM: x0 => x0.isAnonymous,
      GN: x0 => x0.name,
      GO: (x0,x1) => x0.data(x1),
      GP: x0 => globalThis.firebase_firestore.doc(x0),
      H: Function.prototype.call.bind(Number.prototype.toString),
      HB: x0 => new Float64Array(x0),
      HC: x0 => x0.remove(),
      HD: s => new Date(s * 1000).getTimezoneOffset() * 60,
      HE: x0 => new window.FinalizationRegistry(x0),
      HF: x0 => x0.index,
      HG: x0 => x0.maxWidth,
      HH: x0 => x0.arrayBuffer(),
      HI: (o, p) => p in o,
      HJ: x0 => x0.lengthComputable,
      HK: x0 => x0.src,
      HL: x0 => x0.types,
      HM: x0 => x0.emailVerified,
      HN: (x0,x1) => globalThis.firebase_auth.signInWithPopup(x0,x1),
      HO: x0 => x0.nanoseconds,
      HP: x0 => x0.path,
      I: Function.prototype.call.bind(String.prototype.indexOf),
      IB: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmF64ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      IC: (x0,x1) => x0.appendChild(x1),
      ID: Date.now,
      IE: (x0,x1) => x0.unregister(x1),
      IF: (x0,x1) => x0.exec(x1),
      IG: x0 => x0.minHeight,
      IH: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof ArrayBuffer) return 1;
        if (globalThis.SharedArrayBuffer !== undefined &&
            o instanceof SharedArrayBuffer) {
          return 2;
        }
        return 3;
      },
      II: x0 => x0.groups,
      IJ: x0 => x0.upload,
      IK: x0 => x0.close(),
      IL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      IM: x0 => x0.email,
      IN: (x0,x1) => x0.setCustomParameters(x1),
      IO: x0 => x0.seconds,
      IP: (x0,x1) => globalThis.firebase_firestore.collection(x0,x1),
      J: (s, p, i) => s.lastIndexOf(p, i),
      JB: x0 => new ArrayBuffer(x0),
      JC: (x0,x1) => x0.append(x1),
      JD: (x0,x1) => x0.contains(x1),
      JE: x0 => x0.preventDefault(),
      JF: s => s.toUpperCase(),
      JG: x0 => x0.minWidth,
      JH: x0 => x0.status,
      JI: () => new AbortController(),
      JJ: (x0,x1) => x0.getContext(x1),
      JK: (o, p, v) => o[p] = v,
      JL: x0 => x0.relatedTarget,
      JM: x0 => x0.displayName,
      JN: (x0,x1) => x0.addScope(x1),
      JO: () => globalThis.firebase_firestore.Timestamp,
      JP: x0 => x0.measurementId,
      K: (exn) => {
        if (exn instanceof Error) {
          return exn.stack;
        } else {
          return null;
        }
      },
      KB: (x0,x1,x2) => new Uint8Array(x0,x1,x2),
      KC: (x0,x1,x2,x3) => x0.setProperty(x1,x2,x3),
      KD: (decoder, codeUnits) => decoder.decode(codeUnits),
      KE: x0 => x0.parent,
      KF: x0 => x0.length,
      KG: (x0,x1) => x0.removeProperty(x1),
      KH: (x0,x1) => x0.fetch(x1),
      KI: (x0,x1,x2,x3,x4,x5) => ({method: x0,headers: x1,body: x2,credentials: x3,redirect: x4,signal: x5}),
      KJ: (x0,x1,x2,x3,x4) => x0.fillRect(x1,x2,x3,x4),
      KK: x0 => x0.height,
      KL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      KM: x0 => globalThis.firebase_auth.multiFactor(x0),
      KN: () => new firebase_auth.GoogleAuthProvider(),
      KO: () => globalThis.firebase_firestore.DocumentReference,
      KP: x0 => x0.appId,
      L: o => o === undefined,
      LB: (x0,x1,x2) => new DataView(x0,x1,x2),
      LC: x0 => x0.style,
      LD: () => new TextDecoder("utf-8", {fatal: true}),
      LE: x0 => x0.timeStamp,
      LF: x0 => x0.pop(),
      LG: (x0,x1) => x0.add(x1),
      LH: x0 => x0.content,
      LI: (x0,x1) => globalThis.fetch(x0,x1),
      LJ: (x0,x1,x2,x3,x4,x5) => x0.drawImage(x1,x2,x3,x4,x5),
      LK: x0 => x0.width,
      LL: (x0,x1) => { x0.dropEffect = x1 },
      LM: x0 => x0.call(),
      LN: (x0,x1) => globalThis.firebase_auth.signInWithRedirect(x0,x1),
      LO: x0 => x0.path,
      LP: x0 => x0.messagingSenderId,
      M: o => String(o),
      MB: (o, p) => o[p],
      MC: x0 => x0.debugShowSemanticsNodes,
      MD: () => new TextDecoder("utf-8", {fatal: false}),
      ME: (x0,x1) => x0.hasAttribute(x1),
      MF: x0 => x0.flags,
      MG: x0 => x0.data,
      MH: x0 => x0.document,
      MI: (x0,x1) => x0.get(x1),
      MJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MK: (x0,x1,x2,x3,x4,x5) => x0.createImageBitmap(x1,x2,x3,x4,x5),
      ML: (x0,x1,x2) => x0.insertBefore(x1,x2),
      MM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      MN: x0 => x0.signOut(),
      MO: x0 => x0.ref,
      MP: x0 => x0.authDomain,
      N: (c) =>
      queueMicrotask(() => dartInstance.exports.$invokeCallback(c)),
      NB: (o) => new DataView(o.buffer, o.byteOffset, o.byteLength),
      NC: o => o,
      ND: (a, i, v) => a[i] = v,
      NE: x0 => x0.type,
      NF: (a, s) => a.join(s),
      NG: (x0,x1) => x0.removeAttribute(x1),
      NH: () => typeof dartUseDateNowForTicks !== "undefined",
      NI: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1,x2) { return wasmFunction(f,arguments.length,x0,x1,x2) }),
      NJ: (x0,x1,x2,x3) => x0.toBlob(x1,x2,x3),
      NK: (x0,x1,x2) => x0.createImageBitmap(x1,x2),
      NL: x0 => x0.id,
      NM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      NO: (x0,x1) => x0.get(x1),
      NP: x0 => x0.projectId,
      O: (x0,x1) => x0.didCreateEngineInitializer(x1),
      OB: Function.prototype.call.bind(Object.getOwnPropertyDescriptor(DataView.prototype, 'byteLength').get),
      OC: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'boolean') return 1;
        return 2;
      },
      OD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI8ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      OE: (x0,x1) => x0.getModifierState(x1),
      OF: (x0,x1) => x0.error(x1),
      OG: (x0,x1) => { x0.value = x1 },
      OH: () => Date.now(),
      OI: (x0,x1) => x0.forEach(x1),
      OJ: x0 => x0.arrayBuffer(),
      OK: (x0,x1) => x0.createImageBitmap(x1),
      OL: x0 => x0.offsetHeight,
      OM: (x0,x1,x2) => x0.onIdTokenChanged(x1,x2),
      ON: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      OO: (x0,x1,x2,x3) => x0.set(x1,x2,x3),
      OP: (x0,x1,x2,x3,x4,x5,x6,x7) => ({apiKey: x0,authDomain: x1,databaseURL: x2,projectId: x3,storageBucket: x4,messagingSenderId: x5,measurementId: x6,appId: x7}),
      P: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      PB: o => o.byteOffset,
      PC: (x0,x1) => x0.warn(x1),
      PD: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmI32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      PE: x0 => x0.buttons,
      PF: () => globalThis.console,
      PG: (x0,x1) => { x0.value = x1 },
      PH: () => 1000 * performance.now(),
      PI: x0 => x0.name,
      PJ: x0 => x0.close(),
      PK: x0 => new Blob(x0),
      PL: x0 => x0.offsetWidth,
      PM: x0 => x0.toJSON(),
      PN: x0 => x0.hostname,
      PO: (x0,x1,x2) => x0.set(x1,x2),
      PP: (x0,x1) => globalThis.firebase_core.initializeApp(x0,x1),
      Q: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      QB: o => o.buffer,
      QC: x0 => x0.console,
      QD: (s) => +s,
      QE: x0 => x0.ctrlKey,
      QF: s => s.trimRight(),
      QG: x0 => x0.value,
      QH: x0 => new Uint8Array(x0),
      QI: x0 => x0.statusText,
      QJ: (x0,x1) => { x0.imageSmoothingQuality = x1 },
      QK: x0 => x0.close(),
      QL: x0 => x0.stopPropagation(),
      QM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      QN: x0 => x0.sessionStorage,
      QO: x0 => ({merge: x0}),
      QP: x0 => globalThis.firebase_core.initializeApp(x0),
      R: (x0,x1) => ({initializeEngine: x0,autoStart: x1}),
      RB: Function.prototype.call.bind(DataView.prototype.getUint8),
      RC: () => globalThis.window,
      RD: s => {
        if (!/^\s*[+-]?(?:Infinity|NaN|(?:\.\d+|\d+(?:\.\d*)?)(?:[eE][+-]?\d+)?)\s*$/.test(s)) {
          return NaN;
        }
        return parseFloat(s);
      },
      RE: x0 => x0.getBoundingClientRect(),
      RF: x0 => x0.blur(),
      RG: x0 => x0.selectionDirection,
      RH: (x0,x1,x2) => x0.slice(x1,x2),
      RI: x0 => x0.url,
      RJ: (x0,x1) => { x0.imageSmoothingEnabled = x1 },
      RK: x0 => x0.naturalHeight,
      RL: x0 => x0.disabled,
      RM: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      RN: x0 => x0.name,
      RO: x0 => ({mergeFields: x0}),
      RP: x0 => x0.storageBucket,
      S: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      SB: (b, o) => new DataView(b, o),
      SC: (o, c) => o instanceof c,
      SD: s => s.trim(),
      SE: x0 => x0.y,
      SF: x0 => x0.button,
      SG: x0 => x0.selectionStart,
      SH: (x0,x1) => x0.decode(x1),
      SI: x0 => x0.status,
      SJ: (x0,x1) => { x0.fillStyle = x1 },
      SK: x0 => x0.naturalWidth,
      SL: (x0,x1) => { x0.min = x1 },
      SM: (x0,x1,x2) => x0.onAuthStateChanged(x1,x2),
      SN: (x0,x1,x2) => globalThis.firebase_core.registerVersion(x0,x1,x2),
      SO: (x0,x1) => globalThis.firebase_firestore.getFirestore(x0,x1),
      SP: x0 => x0.databaseURL,
      T: x0 => new Promise(x0),
      TB: (b, o, l) => new DataView(b, o, l),
      TC: (string, token) => string.split(token),
      TD: x0 => x0.classList,
      TE: x0 => x0.x,
      TF: (x0,x1) => x0.prepend(x1),
      TG: x0 => x0.selectionEnd,
      TH: (x0,x1) => x0.adoptText(x1),
      TI: x0 => x0.getReader(),
      TJ: (x0,x1) => { x0.height = x1 },
      TK: (x0,x1) => { x0.src = x1 },
      TL: (x0,x1) => { x0.max = x1 },
      TM: (x0,x1,x2) => ({errorMap: x0,persistence: x1,popupRedirectResolver: x2}),
      TN: x0 => new firebase_firestore.FieldPath(x0),
      TO: (x0,x1,x2) => x0.set(x1,x2),
      TP: x0 => x0.apiKey,
      U: (x0,x1,x2) => x0.call(x1,x2),
      UB: Function.prototype.call.bind(DataView.prototype.getFloat64),
      UC: o => o instanceof Array,
      UD: x0 => x0.relatedTarget,
      UE: x0 => x0.top,
      UF: x0 => x0.parentElement,
      UG: x0 => x0.value,
      UH: x0 => x0.first(),
      UI: x0 => x0.read(),
      UJ: (x0,x1) => { x0.width = x1 },
      UK: x0 => x0.displayHeight,
      UL: (x0,x1) => { x0.disabled = x1 },
      UM: (x0,x1) => globalThis.firebase_auth.initializeAuth(x0,x1),
      UN: (x0,x1) => new firebase_firestore.FieldPath(x0,x1),
      UO: (x0,x1) => x0.delete(x1),
      UP: x0 => x0.options,
      V: (constructor, args) => {
        const factoryFunction = constructor.bind.apply(
            constructor, [null, ...args]);
        return new factoryFunction();
      },
      VB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float64Array) return 1;
        return 2;
      },
      VC: (a, i) => a[i],
      VD: x0 => x0.hasFocus(),
      VE: x0 => x0.left,
      VF: x0 => x0.innerHeight,
      VG: x0 => x0.selectionDirection,
      VH: x0 => x0.next(),
      VI: x0 => x0.value,
      VJ: x0 => x0.maxTouchPoints,
      VK: x0 => x0.displayWidth,
      VL: (x0,x1) => { x0.scrollLeft = x1 },
      VM: () => globalThis.firebase_auth.browserPopupRedirectResolver,
      VN: (x0,x1,x2) => new firebase_firestore.FieldPath(x0,x1,x2),
      VO: x0 => x0.commit(),
      VP: () => globalThis.firebase_core.SDK_VERSION,
      W: x0 => new Array(x0),
      WB: Function.prototype.call.bind(DataView.prototype.setFloat64),
      WC: a => a.length,
      WD: x0 => x0.shiftKey,
      WE: x0 => x0.scrollTop,
      WF: x0 => x0.innerWidth,
      WG: x0 => x0.selectionStart,
      WH: x0 => x0.current(),
      WI: x0 => x0.done,
      WJ: x0 => x0.userAgent,
      WK: x0 => x0.duration,
      WL: (x0,x1) => { x0.spellcheck = x1 },
      WM: () => globalThis.firebase_auth.debugErrorMap,
      WN: (x0,x1,x2,x3) => new firebase_firestore.FieldPath(x0,x1,x2,x3),
      WO: x0 => globalThis.firebase_firestore.writeBatch(x0),
      WP: (x0,x1) => x0.debug(x1),
      X: o => [o],
      XB: (t, s) => t.set(s),
      XC: (x0,x1) => x0.test(x1),
      XD: x0 => x0.body,
      XE: x0 => x0.offsetTop,
      XF: x0 => x0.height,
      XG: x0 => x0.selectionEnd,
      XH: (x0,x1) => new Intl.v8BreakIterator(x0,x1),
      XI: x0 => x0.cancel(),
      XJ: x0 => x0.navigator,
      XK: (x0,x1) => ({frameIndex: x0,completeFramesOnly: x1}),
      XL: (x0,x1) => { x0.disabled = x1 },
      XM: () => globalThis.firebase_auth.browserSessionPersistence,
      XN: (x0,x1,x2,x3,x4) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4),
      XO: x0 => x0.metadata,
      XP: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      Y: (o0, o1) => [o0, o1],
      YB: Function.prototype.call.bind(DataView.prototype.setFloat32),
      YC: x0 => x0.userAgent,
      YD: x0 => x0.visibilityState,
      YE: x0 => x0.scrollLeft,
      YF: x0 => x0.width,
      YG: (x0,x1) => { x0.name = x1 },
      YH: x0 => x0.v8BreakIterator,
      YI: x0 => x0.body,
      YJ: x0 => x0.height,
      YK: (x0,x1) => x0.decode(x1),
      YL: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      YM: () => globalThis.firebase_auth.browserLocalPersistence,
      YN: (x0,x1,x2,x3,x4,x5) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5),
      YO: x0 => x0.doc,
      YP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      Z: (o0, o1, o2) => [o0, o1, o2],
      ZB: Function.prototype.call.bind(DataView.prototype.getFloat32),
      ZC: x0 => x0.navigator,
      ZD: (x0,x1,x2) => x0.removeEventListener(x1,x2),
      ZE: x0 => x0.offsetLeft,
      ZF: x0 => x0.clientHeight,
      ZG: (x0,x1) => { x0.placeholder = x1 },
      ZH: () => globalThis.Intl,
      ZI: x0 => x0.headers,
      ZJ: x0 => x0.width,
      ZK: x0 => x0.image,
      ZL: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => x0.drawImage(x1,x2,x3,x4,x5,x6,x7,x8,x9),
      ZM: () => globalThis.firebase_auth.indexedDBLocalPersistence,
      ZN: (x0,x1,x2,x3,x4,x5,x6) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6),
      ZO: x0 => x0.newIndex,
      ZP: (x0,x1) => ({createScript: x0,createScriptURL: x1}),
      a: (o0, o1, o2, o3) => [o0, o1, o2, o3],
      aB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Float32Array) return 1;
        return 2;
      },
      aC: Function.prototype.call.bind(String.prototype.toLowerCase),
      aD: x0 => x0.disconnect(),
      aE: x0 => x0.offsetParent,
      aF: x0 => x0.clientWidth,
      aG: (x0,x1) => { x0.autocomplete = x1 },
      aH: (x0,x1) => x0.segment(x1),
      aI: x0 => x0.signal,
      aJ: x0 => ({imageOrientation: x0}),
      aK: x0 => x0.close(),
      aL: (x0,x1) => x0.getContext(x1),
      aM: x0 => globalThis.firebase_core.getApp(x0),
      aN: (x0,x1,x2,x3,x4,x5,x6,x7) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7),
      aO: x0 => x0.oldIndex,
      aP: (x0,x1,x2) => x0.createPolicy(x1,x2),
      b: (x0,x1,x2) => { x0[x1] = x2 },
      bB: Function.prototype.call.bind(DataView.prototype.getUint32),
      bC: Object.is,
      bD: x0 => new Intl.Locale(x0),
      bE: x0 => x0.offsetY,
      bF: x0 => x0.isConnected,
      bG: (x0,x1) => { x0.type = x1 },
      bH: x0 => x0.index,
      bI: x0 => x0.message,
      bJ: (x0,x1,x2) => x0.createImageBitmap(x1,x2),
      bK: (x0,x1,x2,x3,x4) => ({type: x0,data: x1,premultiplyAlpha: x2,colorSpaceConversion: x3,preferAnimation: x4}),
      bL: (x0,x1) => { x0.height = x1 },
      bM: () => globalThis.firebase_core.getApp(),
      bN: (x0,x1,x2,x3,x4,x5,x6,x7,x8) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8),
      bO: x0 => x0.type,
      bP: (x0,x1) => x0.createScriptURL(x1),
      c: o => o,
      cB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint32Array) return 1;
        return 2;
      },
      cC: x0 => x0.vendor,
      cD: x0 => x0.region,
      cE: x0 => x0.offsetX,
      cF: x0 => x0.head,
      cG: (x0,x1) => { x0.name = x1 },
      cH: x0 => x0.next(),
      cI: x0 => x0.origin,
      cJ: (x0,x1) => ({blob: x0,toType: x1}),
      cK: x0 => new window.ImageDecoder(x0),
      cL: (x0,x1) => { x0.width = x1 },
      cM: x0 => x0.currentUser,
      cN: (x0,x1,x2,x3,x4,x5,x6,x7,x8,x9) => new firebase_firestore.FieldPath(x0,x1,x2,x3,x4,x5,x6,x7,x8,x9),
      cO: x0 => x0.docChanges(),
      cP: (x0,x1,x2) => x0.createScript(x1,x2),
      d: (o, p) => o[p],
      dB: Function.prototype.call.bind(DataView.prototype.getInt32),
      dC: (x0,x1) => x0.createTextNode(x1),
      dD: x0 => x0.script,
      dE: (o, p, r) => o.replace(p, () => r),
      dF: (x0,x1) => { x0.content = x1 },
      dG: (x0,x1) => { x0.placeholder = x1 },
      dH: x0 => x0.value,
      dI: x0 => x0.location,
      dJ: x0 => globalThis.heic2any(x0),
      dK: x0 => x0.name,
      dL: (x0,x1) => x0.transferFromImageBitmap(x1),
      dM: x0 => x0.user,
      dN: () => globalThis.firebase_firestore.documentId(),
      dO: x0 => x0.docs,
      dP: (x0,x1) => x0.appendChild(x1),
      e: () => globalThis,
      eB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int32Array) return 1;
        return 2;
      },
      eC: (x0,x1) => { x0.id = x1 },
      eD: x0 => x0.language,
      eE: (x0,x1) => { x0.lastIndex = x1 },
      eF: (x0,x1) => { x0.name = x1 },
      eG: (x0,x1) => { x0.scrollTop = x1 },
      eH: x0 => x0.done,
      eI: () => globalThis.window,
      eJ: (o) => Array.isArray(o) || o instanceof Array,
      eK: x0 => x0.repetitionCount,
      eL: x0 => x0.rasterEndMilliseconds,
      eM: x0 => x0.idToken,
      eN: (x0,x1) => new firebase_firestore.Timestamp(x0,x1),
      eO: (x0,x1) => ({includeMetadataChanges: x0,source: x1}),
      eP: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      f: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fB: o => o instanceof Uint16Array,
      fC: (x0,x1) => { x0.nonce = x1 },
      fD: x0 => x0.languages,
      fE: (s, m) => {
        try {
          return new RegExp(s, m);
        } catch (e) {
          return String(e);
        }
      },
      fF: (x0,x1) => x0.removeChild(x1),
      fG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      fH: (o, m, a) => o[m].apply(o, a),
      fI: x0 => ({type: x0}),
      fJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fK: x0 => x0.frameCount,
      fL: x0 => x0.rasterStartMilliseconds,
      fM: x0 => x0.secret,
      fN: (x0,x1) => new firebase_firestore.GeoPoint(x0,x1),
      fO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      fP: (o, p) => delete o[p],
      g: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gB: Function.prototype.call.bind(DataView.prototype.getUint16),
      gC: x0 => x0.nonce,
      gD: (x0,x1) => x0.observe(x1),
      gE: o => o instanceof RegExp,
      gF: x0 => x0.firstChild,
      gG: (x0,x1,x2) => x0.setSelectionRange(x1,x2),
      gH: x0 => x0.iterator,
      gI: (x0,x1) => new Blob(x0,x1),
      gJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gK: x0 => x0.selectedTrack,
      gL: x0 => x0.imageBitmaps,
      gM: x0 => x0.accessToken,
      gN: x0 => globalThis.firebase_firestore.vector(x0),
      gO: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      gP: (x0,x1) => { x0.text = x1 },
      h: (x0,x1) => ({addView: x0,removeView: x1}),
      hB: o => o instanceof Int16Array,
      hC: () => globalThis.window.flutterConfiguration,
      hD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      hE: x0 => x0.dotAll,
      hF: x0 => x0.viewConstraints,
      hG: s => {
        if (/[[\]{}()*+?.\\^$|]/.test(s)) {
            s = s.replace(/[[\]{}()*+?.\\^$|]/g, '\\$&');
        }
        return s;
      },
      hH: () => globalThis.Symbol,
      hI: x0 => globalThis.URL.createObjectURL(x0),
      hJ: x0 => x0.head,
      hK: x0 => x0.completed,
      hL: x0 => x0.canvasKitMaximumSurfaces,
      hM: x0 => x0.signInMethod,
      hN: x0 => globalThis.firebase_firestore.Bytes.fromUint8Array(x0),
      hO: (x0,x1,x2,x3) => globalThis.firebase_firestore.onSnapshot(x0,x1,x2,x3),
      hP: (x0,x1) => { x0.text = x1 },
      i: (l, r) => l === r,
      iB: Function.prototype.call.bind(DataView.prototype.getInt16),
      iC: (x0,x1) => x0.attachShadow(x1),
      iD: x0 => new ResizeObserver(x0),
      iE: x0 => x0.unicode,
      iF: x0 => x0.hostElement,
      iG: x0 => x0.keyCode,
      iH: (x0,x1) => new Intl.Segmenter(x0,x1),
      iI: (x0,x1) => x0.append(x1),
      iJ: (x0,x1) => { x0.onerror = x1 },
      iK: x0 => x0.ready,
      iL: x0 => x0.nextSibling,
      iM: x0 => x0.providerId,
      iN: (x0,x1) => globalThis.firebase_firestore.doc(x0,x1),
      iO: (x0,x1,x2) => globalThis.firebase_firestore.where(x0,x1,x2),
      iP: x0 => x0.trustedTypes,
      j: x0 => x0.random(),
      jB: o => o instanceof Uint8ClampedArray,
      jC: (x0,x1) => x0.createElement(x1),
      jD: (x0,x1) => x0.getPropertyValue(x1),
      jE: x0 => x0.ignoreCase,
      jF: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jG: (x0,x1) => x0.scrollIntoView(x1),
      jH: x0 => x0.Segmenter,
      jI: x0 => x0.click(),
      jJ: (x0,x1) => { x0.onload = x1 },
      jK: x0 => x0.tracks,
      jL: (x0,x1) => x0.debug(x1),
      jM: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromResult(x0),
      jN: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      jO: (x0,x1) => globalThis.firebase_firestore.query(x0,x1),
      jP: () => globalThis.console,
      k: o => o,
      kB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Uint8Array) return 1;
        return 2;
      },
      kC: x0 => x0.scale,
      kD: x0 => globalThis.parseFloat(x0),
      kE: x0 => x0.multiline,
      kF: x0 => ({runApp: x0}),
      kG: x0 => x0.multiViewEnabled,
      kH: x0 => x0.buffer,
      kI: x0 => x0.remove(),
      kJ: (x0,x1) => { x0.crossOrigin = x1 },
      kK: () => globalThis.window.ImageDecoder,
      kL: x0 => x0.baseURI,
      kM: x0 => x0.username,
      kN: x0 => ({maxAttempts: x0}),
      kO: () => globalThis.firebase_firestore.and,
      kP: x0 => x0.trustedTypes,
      l: o => {
        if (o === undefined || o === null) return 0;
        if (typeof o === 'number') return 1;
        return 2;
      },
      lB: Function.prototype.call.bind(DataView.prototype.setInt32),
      lC: x0 => x0.visualViewport,
      lD: (x0,x1) => x0.getComputedStyle(x1),
      lE: (o, p, r) => o.replaceAll(p, () => r),
      lF: Function.prototype.call.bind(DataView.prototype.getBigInt64),
      lG: (x0,x1) => x0.replaceWith(x1),
      lH: x0 => x0.wasmMemory,
      lI: x0 => globalThis.URL.revokeObjectURL(x0),
      lJ: (x0,x1) => { x0.integrity = x1 },
      lK: x0 => x0.decode(),
      lL: x0 => x0.hostElement,
      lM: x0 => x0.providerId,
      lN: (x0,x1,x2) => globalThis.firebase_firestore.runTransaction(x0,x1,x2),
      lO: () => globalThis.firebase_firestore.or,
      lP: (x0,x1) => { x0.type = x1 },
      m: () => globalThis.Math,
      mB: Function.prototype.call.bind(DataView.prototype.setUint32),
      mC: x0 => x0.devicePixelRatio,
      mD: x0 => x0.documentElement,
      mE: x0 => x0.deltaMode,
      mF: Function.prototype.call.bind(DataView.prototype.setBigInt64),
      mG: (x0,x1) => { x0.className = x1 },
      mH: () => globalThis.window._flutter_skwasmInstance,
      mI: x0 => x0.body,
      mJ: (x0,x1) => { x0.src = x1 },
      mK: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      mL: x0 => x0.location,
      mM: x0 => x0.profile,
      mN: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      mO: x0 => globalThis.firebase_firestore.limitToLast(x0),
      mP: (o, t) => typeof o === t,
      n: (x0,x1,x2,x3) => x0.addEventListener(x1,x2,x3),
      nB: Function.prototype.call.bind(DataView.prototype.setInt16),
      nC: x0 => x0.height,
      nD: x0 => x0.computedStyleMap(),
      nE: x0 => x0.deltaY,
      nF: (o, start, length) => new BigInt64Array(o.buffer, o.byteOffset + start, length),
      nG: (x0,x1) => { x0.tabIndex = x1 },
      nH: () => new TextDecoder(),
      nI: () => globalThis.document,
      nJ: (x0,x1,x2) => x0.setAttribute(x1,x2),
      nK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      nL: (x0,x1) => x0.getModifierState(x1),
      nM: x0 => x0.isNewUser,
      nN: (o,s,v) => o[s] = v,
      nO: x0 => globalThis.firebase_firestore.limit(x0),
      nP: x0 => x0.extraAssets,
      o: b => !!b,
      oB: Function.prototype.call.bind(DataView.prototype.setUint16),
      oC: x0 => x0.width,
      oD: (x0,x1) => x0.get(x1),
      oE: x0 => x0.deltaX,
      oF: (x0,x1,x2,x3) => x0.pushState(x1,x2,x3),
      oG: (x0,x1) => { x0.action = x1 },
      oH: (map, o, v) => map.set(o, v),
      oI: (x0,x1) => { x0.download = x1 },
      oJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      oK: (x0,x1,x2) => x0.addEventListener(x1,x2),
      oL: x0 => x0.metaKey,
      oM: x0 => globalThis.firebase_auth.getAdditionalUserInfo(x0),
      oN: () => Symbol("jsBoxedDartObjectProperty"),
      oO: () => globalThis.firebase_firestore.endBefore,
      oP: x0 => x0.fontManifest,
      p: () => globalThis.document,
      pB: Function.prototype.call.bind(DataView.prototype.setUint8),
      pC: x0 => x0.screen,
      pD: (o, p) => p in o,
      pE: x0 => x0.wheelDeltaY,
      pF: x0 => x0.history,
      pG: (x0,x1) => { x0.method = x1 },
      pH: (map, o) => map.get(o),
      pI: (x0,x1) => { x0.href = x1 },
      pJ: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pK: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      pL: x0 => x0.altKey,
      pM: x0 => globalThis.firebase_auth.OAuthProvider.credentialFromError(x0),
      pN: (wasmFunction,f) => finalizeWrapper(f, function() { return wasmFunction(f,arguments.length) }),
      pO: () => globalThis.firebase_firestore.endAt,
      pP: x0 => x0.assetManifest,
      q: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      qB: Function.prototype.call.bind(DataView.prototype.setInt8),
      qC: (string, times) => string.repeat(times),
      qD: (x0,x1) => { x0.textContent = x1 },
      qE: x0 => x0.wheelDeltaX,
      qF: (x0,x1,x2,x3) => x0.replaceState(x1,x2,x3),
      qG: (x0,x1) => { x0.noValidate = x1 },
      qH: () => new WeakMap(),
      qI: (x0,x1) => x0.createElement(x1),
      qJ: (x0,x1,x2) => x0.addEventListener(x1,x2),
      qK: x0 => x0.send(),
      qL: x0 => x0.ctrlKey,
      qM: x0 => x0.session,
      qN: () => globalThis.firebase_firestore.deleteField(),
      qO: () => globalThis.firebase_firestore.startAfter,
      qP: x0 => x0.buildConfig,
      r: (x0,x1) => x0.focus(x1),
      rB: Function.prototype.call.bind(DataView.prototype.getInt8),
      rC: o => {
        if (o === null || o === undefined) return 0;
        if (typeof(o) === 'string') return 1;
        return 2;
      },
      rD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      rE: x0 => x0.bottom,
      rF: o => {
        const proto = Object.getPrototypeOf(o);
        return proto === Object.prototype || proto === null;
      },
      rG: x0 => x0.click(),
      rH: x0 => x0.debugSkipFontRetryDelay,
      rI: () => new XMLHttpRequest(),
      rJ: (x0,x1) => { x0.onchange = x1 },
      rK: x0 => x0.status,
      rL: x0 => x0.isComposing,
      rM: x0 => x0.phoneNumber,
      rN: () => globalThis.firebase_firestore.serverTimestamp(),
      rO: () => globalThis.firebase_firestore.startAt,
      rP: x0 => x0.length,
      s: () => ({}),
      sB: o => {
        if (o === null || o === undefined) return 0;
        if (o instanceof Int8Array) return 1;
        return 2;
      },
      sC: x0 => x0.tabIndex,
      sD: x0 => x0.matches,
      sE: x0 => x0.right,
      sF: o => Object.keys(o),
      sG: (x0,x1) => x0.getElementsByClassName(x1),
      sH: (x0,x1,x2) => x0.set(x1,x2),
      sI: (x0,x1,x2) => x0.open(x1,x2),
      sJ: (x0,x1) => x0.item(x1),
      sK: x0 => x0.response,
      sL: x0 => x0.code,
      sM: x0 => x0.uid,
      sN: () => globalThis.firebase_firestore.arrayRemove,
      sO: (x0,x1) => globalThis.firebase_firestore.orderBy(x0,x1),
      sP: x0 => x0.getReader(),
      t: (o, p, v) => o[p] = v,
      tB: (o, start, length) => new Float64Array(o.buffer, o.byteOffset + start, length),
      tC: (x0,x1) => x0.contains(x1),
      tD: (x0,x1) => x0.matchMedia(x1),
      tE: x0 => x0.clientY,
      tF: x0 => x0.state,
      tG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF32ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      tH: x0 => x0.fontFallbackBaseUrl,
      tI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      tJ: x0 => x0.length,
      tK: (x0,x1,x2) => x0.setRequestHeader(x1,x2),
      tL: x0 => x0.repeat,
      tM: () => {
        return typeof process != "undefined" &&
               Object.prototype.toString.call(process) == "[object process]" &&
               process.platform == "win32"
      },
      tN: () => globalThis.firebase_firestore.arrayUnion,
      tO: x0 => globalThis.firebase_firestore.getDocs(x0),
      tP: x0 => x0.value,
      u: () => [],
      uB: (o, start, length) => new Float32Array(o.buffer, o.byteOffset + start, length),
      uC: x0 => x0.activeElement,
      uD: x0 => x0.matches,
      uE: x0 => x0.clientX,
      uF: x0 => x0.state,
      uG: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const setValue = dartInstance.exports.$wasmF64ArraySet;
        for (let i = 0; i < length; i++) {
          setValue(wasmArray, wasmArrayOffset + i, jsArray[jsArrayOffset + i]);
        }
      },
      uH: (handle) => clearInterval(handle),
      uI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      uJ: x0 => x0.files,
      uK: (x0,x1) => { x0.responseType = x1 },
      uL: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      uM: x0 => x0.enrollmentTime,
      uN: (x0,x1) => x0.delete(x1),
      uO: x0 => globalThis.firebase_firestore.getDocsFromServer(x0),
      uP: x0 => x0.done,
      v: (a, i) => a.push(i),
      vB: (o, start, length) => new Uint32Array(o.buffer, o.byteOffset + start, length),
      vC: x0 => x0.parentNode,
      vD: o => typeof o === 'function' && o[jsWrappedDartFunctionSymbol] === true,
      vE: x0 => x0.changedTouches,
      vF: (x0,x1) => x0.go(x1),
      vG: (x0,x1) => x0.dispatchEvent(x1),
      vH: (ms, c) =>
      setInterval(() => dartInstance.exports.$invokeCallback(c), ms),
      vI: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      vJ: (x0,x1) => { x0.multiple = x1 },
      vK: () => new XMLHttpRequest(),
      vL: (x0,x1,x2,x3) => x0.open(x1,x2,x3),
      vM: x0 => x0.factorId,
      vN: x0 => ({serverTimestamps: x0}),
      vO: x0 => globalThis.firebase_firestore.getDocsFromCache(x0),
      vP: x0 => x0.read(),
      w: x0 => new Int8Array(x0),
      wB: (o, start, length) => new Int32Array(o.buffer, o.byteOffset + start, length),
      wC: x0 => x0.tagName,
      wD: f => f.dartFunction,
      wE: x0 => x0.key,
      wF: x0 => x0.hash,
      wG: (x0,x1) => x0.createEvent(x1),
      wH: () => Date.now(),
      wI: () => new FormData(),
      wJ: (x0,x1) => { x0.accept = x1 },
      wK: () => {
        // On browsers return `globalThis.location.href`
        if (globalThis.location != null) {
          return globalThis.location.href;
        }
        return null;
      },
      wL: x0 => x0.providerId,
      wM: x0 => x0.displayName,
      wN: x0 => x0.fromCache,
      wO: x0 => x0.source,
      wP: x0 => x0.body,
      x: (jsArray, jsArrayOffset, wasmArray, wasmArrayOffset, length) => {
        const getValue = dartInstance.exports.$wasmI8ArrayGet;
        for (let i = 0; i < length; i++) {
          jsArray[jsArrayOffset + i] = getValue(wasmArray, wasmArrayOffset + i);
        }
      },
      xB: (o, start, length) => new Uint16Array(o.buffer, o.byteOffset + start, length),
      xC: x0 => x0.target,
      xD: (wasmFunction,f) => finalizeWrapper(f, function(x0) { return wasmFunction(f,arguments.length,x0) }),
      xE: x0 => x0.identifier,
      xF: x0 => x0.location,
      xG: (x0,x1,x2,x3) => x0.initEvent(x1,x2,x3),
      xH: (x0,x1) => x0.getRandomValues(x1),
      xI: (x0,x1,x2,x3) => x0.append(x1,x2,x3),
      xJ: (x0,x1) => { x0.type = x1 },
      xK: x0 => x0.input,
      xL: x0 => x0.uid,
      xM: x0 => x0.hints,
      xN: x0 => x0.hasPendingWrites,
      xO: x0 => ({source: x0}),
      xP: (x0,x1) => new OffscreenCanvas(x0,x1),
      y: x0 => new Uint8Array(x0),
      yB: (o, start, length) => new Int16Array(o.buffer, o.byteOffset + start, length),
      yC: x0 => x0.clientY,
      yD: (wasmFunction,f) => finalizeWrapper(f, function(x0,x1) { return wasmFunction(f,arguments.length,x0,x1) }),
      yE: x0 => x0.touches,
      yF: x0 => x0.search,
      yG: x0 => x0.readText(),
      yH: () => globalThis.crypto,
      yI: (x0,x1,x2) => x0.append(x1,x2),
      yJ: x0 => x0.naturalHeight,
      yK: () => globalThis.window.navigator.userAgent,
      yL: x0 => x0.providerData,
      yM: x0 => x0.tenantId,
      yN: x0 => x0.metadata,
      yO: x0 => globalThis.firebase_firestore.getDoc(x0),
      yP: x0 => x0.assetBase,
      z: x0 => new Uint8ClampedArray(x0),
      zB: (o, start, length) => new Uint8ClampedArray(o.buffer, o.byteOffset + start, length),
      zC: x0 => x0.clientX,
      zD: (p, s, f) => p.then(s, (e) => f(e, e === undefined)),
      zE: x0 => x0.pressure,
      zF: x0 => x0.pathname,
      zG: x0 => x0.clipboard,
      zH: l => new DataView(new ArrayBuffer(l)),
      zI: (x0,x1) => x0.send(x1),
      zJ: x0 => x0.naturalWidth,
      zK: (x0,x1) => x0.removeItem(x1),
      zL: x0 => x0.tenantId,
      zM: x0 => x0.phoneNumber,
      zN: x0 => x0.toArray(),
      zO: x0 => globalThis.firebase_firestore.getDocFromServer(x0),
      zP: x0 => x0.loader,

    };

    const baseImports = {
      _: dart2wasm,
      Math: Math,
      Date: Date,
      Object: Object,
      Array: Array,
      Reflect: Reflect,
      WebAssembly: {
        JSTag: WebAssembly.JSTag,
      },
      "": new Proxy({}, { get(_, prop) { return prop; } }),

    };

    

    dartInstance = await WebAssembly.instantiate(this.module, {
      ...baseImports,
      ...additionalImports,
      
    });

    return new InstantiatedApp(this, dartInstance);
  }
}

class InstantiatedApp {
  constructor(compiledApp, instantiatedModule) {
    this.compiledApp = compiledApp;
    this.instantiatedModule = instantiatedModule;
  }

  // Call the main function with the given arguments.
  invokeMain(...args) {
    this.instantiatedModule.exports.$invokeMain(args);
  }
}
