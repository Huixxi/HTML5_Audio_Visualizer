/**
 * An audio spectrum visualizer built with HTML5 Audio API
 * Author: Huixxi
 * License: MIT
 * Mar 15, 2025
 * Enhanced: Added customizable visualization controls
 */
window.onload = function() {
    new Visualizer().ini();
    
    // 初始化录制功能
    initializeRecordingFeature();
    
    // 初始化样式控制面板
    initializeStyleControls();
};

// 全局样式设置对象
var visualizerSettings = {
    // 默认颜色设置
    colors: {
        top: '#ffffff',    // 顶部颜色
        middle: '#aaaaaa', // 中间颜色
        bottom: '#555555'  // 底部颜色
    },
    // 频谱样式设置
    meterWidth: 10,   // 频谱条宽度
    gap: 2,           // 频谱条间距
    capHeight: 2,     // 顶部小帽高度
    capColor: '#fff', // 顶部小帽颜色
    heightScale: 1.0  // 高度缩放比例
};

// 初始化样式控制面板
function initializeStyleControls() {
    // 修改可视化区域的容器布局为弹性布局
    var visualizerWrapper = document.getElementById('visualizer_wrapper');
    visualizerWrapper.style.display = 'flex';
    visualizerWrapper.style.flexDirection = 'row';
    visualizerWrapper.style.alignItems = 'flex-start';
    visualizerWrapper.style.gap = '20px';
    
    // 调整canvas容器样式
    var canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    
    // 将canvas移动到新的容器
    var canvas = document.getElementById('canvas');
    visualizerWrapper.removeChild(canvas);
    canvasContainer.appendChild(canvas);
    visualizerWrapper.appendChild(canvasContainer);
    
    // 创建样式控制面板
    var controlPanel = document.createElement('div');
    controlPanel.id = 'style_controls';
    controlPanel.innerHTML = `
        <h3>Visualization Settings</h3>
        
        <div class="control-section">
            <h4>Colors</h4>
            <div class="color-controls">
                <div class="color-control">
                    <span class="color-label">Top</span>
                    <input type="color" id="topColor" value="${visualizerSettings.colors.top}">
                </div>
                <div class="color-control">
                    <span class="color-label">Middle</span>
                    <input type="color" id="middleColor" value="${visualizerSettings.colors.middle}">
                </div>
                <div class="color-control">
                    <span class="color-label">Bottom</span>
                    <input type="color" id="bottomColor" value="${visualizerSettings.colors.bottom}">
                </div>
            </div>
        </div>
        
        <div class="control-section">
            <h4>Bar Dimensions</h4>
            <div class="control-group">
                <label for="barWidth">Width</label>
                <div class="slider-with-value">
                    <input type="range" id="barWidth" min="3" max="20" value="${visualizerSettings.meterWidth}">
                    <span id="widthValue" class="value-display">${visualizerSettings.meterWidth}px</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="barGap">Gap</label>
                <div class="slider-with-value">
                    <input type="range" id="barGap" min="0" max="5" value="${visualizerSettings.gap}">
                    <span id="gapValue" class="value-display">${visualizerSettings.gap}px</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="heightScale">Height</label>
                <div class="slider-with-value">
                    <input type="range" id="heightScale" min="0.5" max="2" step="0.1" value="${visualizerSettings.heightScale}">
                    <span id="heightValue" class="value-display">${visualizerSettings.heightScale}×</span>
                </div>
            </div>
        </div>
        
        <div class="control-section">
            <h4>Presets</h4>
            <div class="preset-buttons">
                <button class="preset-btn" data-preset="classic">Classic</button>
                <button class="preset-btn" data-preset="neon">Neon</button>
                <button class="preset-btn" data-preset="monochrome">Mono</button>
            </div>
        </div>
    `;
    
    // 添加样式
    var style = document.createElement('style');
    style.textContent = `
        .canvas-container {
            flex: 1;
            min-width: 0;
        }
        
        #canvas {
            max-width: 100%;
            height: auto;
        }
        
        #style_controls {
            width: 220px;
            background-color: rgba(20, 20, 30, 0.8);
            border-radius: 10px;
            padding: 16px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            color: #fff;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        #style_controls h3 {
            margin: 0 0 15px 0;
            font-size: 18px;
            color: #fff;
            text-align: center;
            padding-bottom: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        #style_controls h4 {
            margin: 0 0 10px 0;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.8);
        }
        
        .control-section {
            margin-bottom: 18px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .control-section:last-child {
            border-bottom: none;
            margin-bottom: 0;
            padding-bottom: 0;
        }
        
        .color-controls {
            display: flex;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 5px;
        }
        
        .color-control {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
        }
        
        .color-label {
            font-size: 12px;
            color: rgba(255, 255, 255, 0.6);
        }
        
        #style_controls input[type="color"] {
            width: 40px;
            height: 25px;
            border: none;
            border-radius: 4px;
            background: none;
            cursor: pointer;
            padding: 0;
            box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.2);
            transition: transform 0.2s;
        }
        
        #style_controls input[type="color"]:hover {
            transform: scale(1.1);
        }
        
        .control-group {
            margin-bottom: 12px;
        }
        
        .control-group:last-child {
            margin-bottom: 0;
        }
        
        #style_controls label {
            display: block;
            margin-bottom: 5px;
            font-size: 13px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .slider-with-value {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        #style_controls input[type="range"] {
            flex: 1;
            height: 5px;
            border-radius: 5px;
            background: rgba(255, 255, 255, 0.2);
            appearance: none;
            outline: none;
        }
        
        #style_controls input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: 12px;
            height: 12px;
            background: #fff;
            border-radius: 50%;
            cursor: pointer;
            transition: transform 0.2s;
        }
        
        #style_controls input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.3);
        }
        
        .value-display {
            width: 40px;
            font-size: 12px;
            color: rgba(255, 255, 255, 0.7);
            text-align: right;
        }
        
        .preset-buttons {
            display: flex;
            justify-content: space-between;
            gap: 5px;
        }
        
        .preset-btn {
            flex: 1;
            background: rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.8);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 5px 0;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .preset-btn:hover {
            background: rgba(255, 255, 255, 0.2);
        }
        
        /* 响应式调整 */
        @media (max-width: 768px) {
            #visualizer_wrapper {
                flex-direction: column;
            }
            
            #style_controls {
                width: 100%;
                margin-top: 15px;
            }
            
            .color-controls {
                justify-content: space-around;
            }
        }
    `;
    
    // 添加到DOM
    document.head.appendChild(style);
    visualizerWrapper.appendChild(controlPanel);
    
    // 添加事件监听器
    document.getElementById('topColor').addEventListener('input', function(e) {
        visualizerSettings.colors.top = e.target.value;
    });
    
    document.getElementById('middleColor').addEventListener('input', function(e) {
        visualizerSettings.colors.middle = e.target.value;
    });
    
    document.getElementById('bottomColor').addEventListener('input', function(e) {
        visualizerSettings.colors.bottom = e.target.value;
    });
    
    document.getElementById('barWidth').addEventListener('input', function(e) {
        visualizerSettings.meterWidth = parseInt(e.target.value);
        document.getElementById('widthValue').textContent = visualizerSettings.meterWidth + 'px';
    });
    
    document.getElementById('barGap').addEventListener('input', function(e) {
        visualizerSettings.gap = parseInt(e.target.value);
        document.getElementById('gapValue').textContent = visualizerSettings.gap + 'px';
    });
    
    document.getElementById('heightScale').addEventListener('input', function(e) {
        visualizerSettings.heightScale = parseFloat(e.target.value);
        document.getElementById('heightValue').textContent = visualizerSettings.heightScale + '×';
    });
    
    // 添加预设按钮事件处理
    document.querySelectorAll('.preset-btn').forEach(button => {
        button.addEventListener('click', function() {
            const preset = this.dataset.preset;
            
            switch(preset) {
                case 'classic':
                    // 经典红黄绿渐变
                    applyPreset('#f00', '#ff0', '#0f0', 10, 2, 1.0);
                    break;
                case 'neon':
                    // 霓虹效果
                    applyPreset('#ff00ff', '#00ffff', '#0080ff', 5, 1, 1.2);
                    break;
                case 'monochrome':
                    // 单色白色渐变
                    applyPreset('#ffffff', '#aaaaaa', '#555555', 8, 3, 0.9);
                    break;
            }
        });
    });
    
    // 应用预设函数
    function applyPreset(bottom, middle, top, width, gap, height) {
        // 更新设置
        visualizerSettings.colors.bottom = bottom;
        visualizerSettings.colors.middle = middle;
        visualizerSettings.colors.top = top;
        visualizerSettings.meterWidth = width;
        visualizerSettings.gap = gap;
        visualizerSettings.heightScale = height;
        
        // 更新UI
        document.getElementById('topColor').value = top;
        document.getElementById('middleColor').value = middle;
        document.getElementById('bottomColor').value = bottom;
        
        document.getElementById('barWidth').value = width;
        document.getElementById('widthValue').textContent = width + 'px';
        
        document.getElementById('barGap').value = gap;
        document.getElementById('gapValue').textContent = gap + 'px';
        
        document.getElementById('heightScale').value = height;
        document.getElementById('heightValue').textContent = height + '×';
    }
    
    // 如果是录制控件，确保它们位于合适位置
    var recordingControls = document.getElementById('recording_controls');
    if (recordingControls) {
        canvasContainer.appendChild(recordingControls);
    }
}

// 初始化录制功能
function initializeRecordingFeature() {
    // 确保HTML中包含必要的按钮和状态显示元素
    var visualizerWrapper = document.getElementById('visualizer_wrapper');
    if (!document.getElementById('recording_controls')) {
        // 创建录制控件 - 不使用模板字符串避免编码问题
        var recordingControls = document.createElement('div');
        recordingControls.id = 'recording_controls';
        
        // 创建开始录制按钮
        var startBtn = document.createElement('button');
        startBtn.id = 'startRecording';
        startBtn.innerHTML = 'Start Recording';
        
        // 创建停止录制按钮
        var stopBtn = document.createElement('button');
        stopBtn.id = 'stopRecording';
        stopBtn.disabled = true;
        stopBtn.innerHTML = 'Stop Recording';
        
        // 创建状态文本
        var statusSpan = document.createElement('span');
        statusSpan.id = 'recordingStatus';
        
        // 添加按钮和状态文本到控件容器
        recordingControls.appendChild(startBtn);
        recordingControls.appendChild(stopBtn);
        recordingControls.appendChild(statusSpan);
        
        // 添加控件容器到可视化器包装器
        visualizerWrapper.appendChild(recordingControls);
        
        // 添加样式
        var style = document.createElement('style');
        style.textContent = 
            '#recording_controls {' +
            '    text-align: center;' +
            '    margin-top: 15px;' +
            '}' +
            '#recording_controls button {' +
            '    padding: 8px 16px;' +
            '    margin: 0 5px;' +
            '    background-color: #444;' +
            '    color: white;' +
            '    border: none;' +
            '    border-radius: 4px;' +
            '    cursor: pointer;' +
            '}' +
            '#recording_controls button:hover:not(:disabled) {' +
            '    background-color: #555;' +
            '}' +
            '#recording_controls button:disabled {' +
            '    background-color: #333;' +
            '    color: #666;' +
            '    cursor: not-allowed;' +
            '}' +
            '#recordingStatus {' +
            '    margin-left: 10px;' +
            '    color: #aaa;' +
            '}';
            
        document.head.appendChild(style);
    }
    
    // 获取按钮和状态元素
    var canvas = document.getElementById('canvas');
    var startRecordingBtn = document.getElementById('startRecording');
    var stopRecordingBtn = document.getElementById('stopRecording');
    var recordingStatus = document.getElementById('recordingStatus');
    
    // 录制相关变量
    var mediaRecorder = null;
    var recordedChunks = [];
    var isRecording = false;
    
    // 添加事件监听器
    startRecordingBtn.addEventListener('click', startRecording);
    stopRecordingBtn.addEventListener('click', stopRecording);
    
    // 开始录制函数
    function startRecording() {
        recordedChunks = [];
        
        // 检查浏览器支持性
        if (!canvas.captureStream) {
            recordingStatus.textContent = 'Your browser does not support canvas recording';
            return;
        }
        
        // 捕获canvas为媒体流（30fps）
        var stream = canvas.captureStream(30);
        
        // 尝试使用不同的MIME类型
        var options = {mimeType: 'video/webm;codecs=vp9'};
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
            options = {mimeType: 'video/webm;codecs=vp8'};
            if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                options = {mimeType: 'video/webm'};
                if (!MediaRecorder.isTypeSupported(options.mimeType)) {
                    options = {mimeType: ''};
                }
            }
        }
        
        try {
            mediaRecorder = new MediaRecorder(stream, options);
        } catch (e) {
            console.error('MediaRecorder creation failed:', e);
            recordingStatus.textContent = 'Recording initialization failed';
            return;
        }
        
        // 数据可用时添加到chunks数组
        mediaRecorder.ondataavailable = function(e) {
            if (e.data && e.data.size > 0) {
                recordedChunks.push(e.data);
            }
        };
        
        // 录制停止时创建并下载视频文件
        mediaRecorder.onstop = function() {
            var blob = new Blob(recordedChunks, {type: 'video/webm'});
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = 'audio-visualizer-' + new Date().toISOString() + '.webm';
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                recordingStatus.textContent = 'Video saved';
            }, 100);
        };
        
        // 开始录制
        mediaRecorder.start(100); // 每100ms生成一个数据块
        isRecording = true;
        startRecordingBtn.disabled = true;
        stopRecordingBtn.disabled = false;
        recordingStatus.textContent = 'Recording...';
    }
    
    // 停止录制函数
    function stopRecording() {
        if (mediaRecorder && isRecording) {
            mediaRecorder.stop();
            isRecording = false;
            startRecordingBtn.disabled = false;
            stopRecordingBtn.disabled = true;
            recordingStatus.textContent = 'Video processing...';
        }
    }
}

var Visualizer = function() {
    this.file = null; //the current file
    this.fileName = null; //the current file name
    this.audioContext = null;
    this.source = null; //the audio source
    this.info = document.getElementById('info').innerHTML; //used to upgrade the UI information
    this.infoUpdateId = null; //to store the setTimeout ID and clear the interval
    this.animationId = null;
    this.status = 0; //flag for sound is playing 1 or stopped 0
    this.forceStop = false;
    this.allCapsReachBottom = false;
};

Visualizer.prototype = {
    ini: function() {
        this._prepareAPI();
        this._addEventListner();
    },
    _prepareAPI: function() {
        //fix browser vender for AudioContext and requestAnimationFrame
        window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.msAudioContext;
        window.requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.msRequestAnimationFrame;
        window.cancelAnimationFrame = window.cancelAnimationFrame || window.webkitCancelAnimationFrame || window.mozCancelAnimationFrame || window.msCancelAnimationFrame;
        try {
            this.audioContext = new AudioContext();
        } catch (e) {
            this._updateInfo('!Your browser does not support AudioContext', false);
            console.log(e);
        }
    },
    _addEventListner: function() {
        var that = this,
            audioInput = document.getElementById('uploadedFile'),
            dropContainer = document.getElementsByTagName("canvas")[0];
        //listen the file upload
        audioInput.onchange = function() {
            if (that.audioContext===null) {return;};

            //the if statement fixes the file selction cancle, because the onchange will trigger even the file selection been canceled
            if (audioInput.files.length !== 0) {
                //only process the first file
                that.file = audioInput.files[0];
                that.fileName = that.file.name;
                if (that.status === 1) {
                    //the sound is still playing but we upload another file, so set the forceStop flag to true
                    that.forceStop = true;
                };
                document.getElementById('fileWrapper').style.opacity = 1;
                that._updateInfo('Uploading', true);
                //once the file is ready,start the visualizer
                that._start();
            };
        };
        //listen the drag & drop
        dropContainer.addEventListener("dragenter", function() {
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Drop it on the page', true);
        }, false);
        dropContainer.addEventListener("dragover", function(e) {
            e.stopPropagation();
            e.preventDefault();
            //set the drop mode
            e.dataTransfer.dropEffect = 'copy';
        }, false);
        dropContainer.addEventListener("dragleave", function() {
            document.getElementById('fileWrapper').style.opacity = 0.2;
            that._updateInfo(that.info, false);
        }, false);
        dropContainer.addEventListener("drop", function(e) {
            e.stopPropagation();
            e.preventDefault();
            if (that.audioContext===null) {return;};
            document.getElementById('fileWrapper').style.opacity = 1;
            that._updateInfo('Uploading', true);
            //get the dropped file
            that.file = e.dataTransfer.files[0];
            if (that.status === 1) {
                document.getElementById('fileWrapper').style.opacity = 1;
                that.forceStop = true;
            };
            that.fileName = that.file.name;
            //once the file is ready,start the visualizer
            that._start();
        }, false);
    },
    _start: function() {
        //read and decode the file into audio array buffer
        var that = this,
            file = this.file,
            fr = new FileReader();
        fr.onload = function(e) {
            var fileResult = e.target.result;
            var audioContext = that.audioContext;
            if (audioContext === null) {
                return;
            };
            that._updateInfo('Decoding the audio', true);
            audioContext.decodeAudioData(fileResult, function(buffer) {
                that._updateInfo('Decode successfully, start the visualizer', true);
                that._visualize(audioContext, buffer);
            }, function(e) {
                that._updateInfo('!Fail to decode the file', false);
                console.error(e);
            });
        };
        fr.onerror = function(e) {
            that._updateInfo('!Fail to read the file', false);
            console.error(e);
        };
        //assign the file to the reader
        this._updateInfo('Starting read the file', true);
        fr.readAsArrayBuffer(file);
    },
    _visualize: function(audioContext, buffer) {
        var audioBufferSouceNode = audioContext.createBufferSource(),
            analyser = audioContext.createAnalyser(),
            that = this;
        //connect the source to the analyser
        audioBufferSouceNode.connect(analyser);
        //connect the analyser to the destination(the speaker), or we won't hear the sound
        analyser.connect(audioContext.destination);
        //then assign the buffer to the buffer source node
        audioBufferSouceNode.buffer = buffer;
        //play the source
        if (!audioBufferSouceNode.start) {
            audioBufferSouceNode.start = audioBufferSouceNode.noteOn //in old browsers use noteOn method
            audioBufferSouceNode.stop = audioBufferSouceNode.noteOff //in old browsers use noteOff method
        };
        //stop the previous sound if any
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
        }
        if (this.source !== null) {
            this.source.stop(0);
        }
        audioBufferSouceNode.start(0);
        this.status = 1;
        this.source = audioBufferSouceNode;
        audioBufferSouceNode.onended = function() {
            that._audioEnd(that);
        };
        this._updateInfo('Playing ' + this.fileName, false);
        this.info = 'Playing ' + this.fileName;
        document.getElementById('fileWrapper').style.opacity = 0.2;
        this._drawSpectrum(analyser);
    },
    _drawSpectrum: function(analyser) {
        var that = this,
            canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2,
            capYPositionArray = []; // store the vertical position of caps for the previous frame
        
        var ctx = canvas.getContext('2d');
        
        var drawMeter = function() {
            // 使用当前样式设置
            var meterWidth = visualizerSettings.meterWidth;
            var gap = visualizerSettings.gap;
            var capHeight = visualizerSettings.capHeight;
            var capStyle = visualizerSettings.capColor;
            var meterNum = Math.floor(cwidth / (meterWidth + gap));
            var heightScale = visualizerSettings.heightScale;
            
            // 创建渐变
            var gradient = ctx.createLinearGradient(0, 0, 0, cheight);
            gradient.addColorStop(1, visualizerSettings.colors.top);
            gradient.addColorStop(0.5, visualizerSettings.colors.middle);
            gradient.addColorStop(0, visualizerSettings.colors.bottom);
            
            var array = new Uint8Array(analyser.frequencyBinCount);
            analyser.getByteFrequencyData(array);
            
            if (that.status === 0) {
                // fix when some sounds end the value still not back to zero
                for (var i = array.length - 1; i >= 0; i--) {
                    array[i] = 0;
                };
                
                allCapsReachBottom = true;
                for (var i = capYPositionArray.length - 1; i >= 0; i--) {
                    allCapsReachBottom = allCapsReachBottom && (capYPositionArray[i] === 0);
                };
                
                if (allCapsReachBottom) {
                    cancelAnimationFrame(that.animationId); //since the sound is stopped and animation finished, stop the requestAnimation to prevent potential memory leak
                    return;
                };
            };
            
            var step = Math.round(array.length / meterNum); // sample limited data from the total array
            ctx.clearRect(0, 0, cwidth, cheight);
            
            for (var i = 0; i < meterNum; i++) {
                var value = array[i * step] * heightScale; // 应用高度缩放
                if (value > cheight) value = cheight; // 限制最大高度
                
                if (capYPositionArray.length < Math.round(meterNum)) {
                    capYPositionArray.push(value);
                };
                
                ctx.fillStyle = capStyle;
                // draw the cap, with transition effect
                if (value < capYPositionArray[i]) {
                    ctx.fillRect(i * (meterWidth + gap), cheight - (--capYPositionArray[i]), meterWidth, capHeight);
                } else {
                    ctx.fillRect(i * (meterWidth + gap), cheight - value, meterWidth, capHeight);
                    capYPositionArray[i] = value;
                };
                
                // set the fillStyle to gradient for a better look
                ctx.fillStyle = gradient;
                // the meter
                ctx.fillRect(i * (meterWidth + gap), cheight - value + capHeight, meterWidth, cheight);
            }
            
            that.animationId = requestAnimationFrame(drawMeter);
        }
        
        this.animationId = requestAnimationFrame(drawMeter);
    },
    _audioEnd: function(instance) {
        if (this.forceStop) {
            this.forceStop = false;
            this.status = 1;
            return;
        };
        this.status = 0;
        var text = 'HTML5 Audio API showcase | An Audio Visualizer';
        document.getElementById('fileWrapper').style.opacity = 1;
        document.getElementById('info').innerHTML = text;
        instance.info = text;
        document.getElementById('uploadedFile').value = '';
    },
    _updateInfo: function(text, processing) {
        var infoBar = document.getElementById('info'),
            dots = '...',
            i = 0,
            that = this;
        infoBar.innerHTML = text + dots.substring(0, i++);
        if (this.infoUpdateId !== null) {
            clearTimeout(this.infoUpdateId);
        };
        if (processing) {
            // animate dots at the end of the info text
            var animateDot = function() {
                if (i > 3) {
                    i = 0
                };
                infoBar.innerHTML = text + dots.substring(0, i++);
                that.infoUpdateId = setTimeout(animateDot, 250);
            }
            this.infoUpdateId = setTimeout(animateDot, 250);
        };
    }
};