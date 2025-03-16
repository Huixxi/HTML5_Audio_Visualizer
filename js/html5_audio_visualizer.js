/**
 * An audio spectrum visualizer built with HTML5 Audio API
 * Author: Huixxi
 * License: MIT
 * Mar 15, 2025
 * Enhanced: Added customizable visualization controls
 */
window.onload = function() {
    new Visualizer().ini();

    // 初始化样式控制面板
    initializeStyleControls();
    
    // 然后初始化播放和录制控件
    initializePlaybackControls();
    initializeRecordingFeature();

    // 添加窗口大小变化监听
    window.addEventListener('resize', resizeCanvas);
    
    // 初始调用一次保证尺寸正确
    resizeCanvas();
};

// 添加 resizeCanvas 函数
function resizeCanvas() {
    var canvas = document.getElementById('canvas');
    var container = canvas.parentElement;
    
    // 获取容器当前宽度
    var containerWidth = container.clientWidth;
    
    // 保持合适的宽高比
    var aspectRatio = 16/10;
    
    // 设置 canvas 尺寸属性
    canvas.width = containerWidth;
    canvas.height = containerWidth / aspectRatio;
    
    // 如果有可视化器正在运行并有分析器，重新绘制
    if (window.currentVisualizer && window.currentVisualizer.analyser) {
        // 取消当前动画
        if (window.currentVisualizer.animationId) {
            cancelAnimationFrame(window.currentVisualizer.animationId);
        }
        // 重新绘制
        window.currentVisualizer._drawSpectrum(window.currentVisualizer.analyser);
    }
}

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
    heightScale: 1.0,  // 高度缩放比例

    // 新增：可视化模式
    mode: 'bars',      // 'bars' 为条形图, 'circle' 为圆形
    
    // 新增：圆形可视化特定设置
    circle: {
        rotationSpeed: 0.005, // 旋转速度
        radius: 90,          // 基础半径
        multiplier: 0.3,      // 频谱条高度倍数
        barCount: 180,        // 圆形上的频谱条数量
        capHeight: 0.8         // 圆形模式专用的小帽高度，更小
    }
};

// 初始化样式控制面板
function initializeStyleControls() {
    // 修改可视化区域的容器布局为弹性布局
    var visualizerWrapper = document.getElementById('visualizer_wrapper');

    // 创建一个新的主内容容器，用于包含canvas和控制元素
    var mainContentContainer = document.createElement('div');
    mainContentContainer.id = 'main_content_container';
    mainContentContainer.style.display = 'flex';
    mainContentContainer.style.flexDirection = 'column';
    mainContentContainer.style.flex = '1';
    mainContentContainer.style.minWidth = '0';

    // 创建canvas容器
    var canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    canvasContainer.style.width = '100%';

    // 创建controls容器，这将包含录制和播放控件
    var controlsContainer = document.createElement('div');
    controlsContainer.id = 'controls_container';
    controlsContainer.style.marginTop = '15px';

    // 重新设置visualizer wrapper样式
    visualizerWrapper.style.display = 'flex';
    visualizerWrapper.style.flexDirection = 'row';
    visualizerWrapper.style.alignItems = 'flex-start';
    visualizerWrapper.style.gap = '20px';
    
    // // 调整canvas容器样式
    // var canvasContainer = document.createElement('div');
    // canvasContainer.className = 'canvas-container';
    // canvasContainer.style.display = 'flex';
    // canvasContainer.style.flexDirection = 'column';
    
    /// 将canvas移动到canvas容器
    var canvas = document.getElementById('canvas');
    if (canvas.parentNode === visualizerWrapper) {
        visualizerWrapper.removeChild(canvas);
    }
    canvasContainer.appendChild(canvas);

    // 设置 canvas 的实际宽高属性而不仅仅是 CSS
    canvas.width = 800;  // 设置所需宽度
    canvas.height = 500; // 设置足够高度以容纳圆形可视化

    // 把播放和录制控制移到controls容器内
    var existingPlaybackControls = document.getElementById('playback_controls');
    var existingRecordingControls = document.getElementById('recording_controls');
    
    if (existingPlaybackControls) {
        if (existingPlaybackControls.parentNode) {
            existingPlaybackControls.parentNode.removeChild(existingPlaybackControls);
        }
        controlsContainer.appendChild(existingPlaybackControls);
    }
    
    if (existingRecordingControls) {
        if (existingRecordingControls.parentNode) {
            existingRecordingControls.parentNode.removeChild(existingRecordingControls);
        }
        controlsContainer.appendChild(existingRecordingControls);
    }
    
    // 构建DOM结构
    mainContentContainer.appendChild(canvasContainer);
    mainContentContainer.appendChild(controlsContainer);
    
    // 清空visualizerWrapper，重新添加组件
    while (visualizerWrapper.firstChild) {
        visualizerWrapper.removeChild(visualizerWrapper.firstChild);
    }
    
    visualizerWrapper.appendChild(mainContentContainer);


    // 创建样式控制面板
    var controlPanel = document.createElement('div');
    controlPanel.id = 'style_controls';

    controlPanel.innerHTML = `
        <h4 class="rainbow-text">Visualization Settings</h4>

        <!-- 新增：可视化模式选择 -->
        <div class="control-section">
            <h5>Display Mode</h5>
            <div class="mode-selector">
                <label class="mode-option">
                    <input type="radio" name="visMode" value="bars" ${visualizerSettings.mode === 'bars' ? 'checked' : ''}>
                    <span>Bar Spectrum</span>
                </label>
                <label class="mode-option">
                    <input type="radio" name="visMode" value="circle" ${visualizerSettings.mode === 'circle' ? 'checked' : ''}>
                    <span>Circle Spectrum</span>
                </label>
            </div>
        </div>
        
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
        
        <!-- 保留原始条形图设置 -->
        <div id="bars-settings" class="control-section" ${visualizerSettings.mode !== 'bars' ? 'style="display:none"' : ''}>
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
                    <span id="heightValue" class="value-display">${visualizerSettings.heightScale}x</span>
                </div>
            </div>
        </div>

        <!-- 新增：圆形模式设置 -->
        <div id="circle-settings" class="control-section" ${visualizerSettings.mode !== 'circle' ? 'style="display:none"' : ''}>
            <h4>Circle Settings</h4>
            <div class="control-group">
                <label for="circleRadius">Radius</label>
                <div class="slider-with-value">
                    <input type="range" id="circleRadius" min="100" max="250" value="${visualizerSettings.circle.radius}">
                    <span id="radiusValue" class="value-display">${visualizerSettings.circle.radius}px</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="rotationSpeed">Rotation</label>
                <div class="slider-with-value">
                    <input type="range" id="rotationSpeed" min="0" max="0.02" step="0.001" value="${visualizerSettings.circle.rotationSpeed}">
                    <span id="rotationValue" class="value-display">${visualizerSettings.circle.rotationSpeed}</span>
                </div>
            </div>
            
            <div class="control-group">
                <label for="barMultiplier">Bar Height</label>
                <div class="slider-with-value">
                    <input type="range" id="barMultiplier" min="0.2" max="1.5" step="0.1" value="${visualizerSettings.circle.multiplier}">
                    <span id="multiplierValue" class="value-display">${visualizerSettings.circle.multiplier}x</span>
                </div>
            </div>

            <div class="control-group">
                <label for="circleGap">Gap</label>
                <div class="slider-with-value">
                    <input type="range" id="circleGap" min="0" max="5" value="${visualizerSettings.gap}">
                    <span id="circleGapValue" class="value-display">${visualizerSettings.gap}px</span>
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
            display: flex;
            justify-content: center;
        }
        
        #canvas {
            max-width: 100%;
            height: auto;
            aspect-ratio: 16/10; /* 保持宽高比例，适合圆形展示 */
        }

        /* Rainbow text effect for the heading */
        .rainbow-text {
            font-size: 18px;
            font-weight: bold;
            background-image: linear-gradient(to right, 
                #ff0000, #ff8000, #ffff00, 
                #00ff00, #00ffff, #0000ff, 
                #8000ff, #ff00ff);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            animation: rainbow-animation 6s linear infinite;
        }
        
        @keyframes rainbow-animation {
            0% { background-position: 0% 50%; }
            100% { background-position: 100% 50%; }
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

    style.textContent += `
        #main_content_container {
            flex: 1;
            min-width: 0;
            display: flex;
            flex-direction: column;
        }
        
        .canvas-container {
            width: 100%;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        #controls_container {
            display: flex;
            flex-direction: column;
            gap: 15px;
            width: 100%;
        }
        
        #playback_controls {
            width: 100%;
            order: 1; /* 确保播放控制在上方 */
        }
        
        #recording_controls {
            width: 100%;
            order: 2; /* 录制控制在下方 */
        }
        
        @media (max-width: 768px) {
            #visualizer_wrapper {
                flex-direction: column;
            }
            
            #style_controls {
                width: 100% !important;
                margin-top: 15px;
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
    
    // 更新条形模式间隙控制，同步到圆形模式
    document.getElementById('barGap').addEventListener('input', function(e) {
        visualizerSettings.gap = parseInt(e.target.value);
        document.getElementById('gapValue').textContent = visualizerSettings.gap + 'px';
        // 同步更新圆形模式的间隙控制
        document.getElementById('circleGap').value = visualizerSettings.gap;
        document.getElementById('circleGapValue').textContent = visualizerSettings.gap + 'px';
    });
    
    document.getElementById('heightScale').addEventListener('input', function(e) {
        visualizerSettings.heightScale = parseFloat(e.target.value);
        document.getElementById('heightValue').textContent = visualizerSettings.heightScale + 'x';
    });

    // 新增：可视化模式切换事件监听器
    document.querySelectorAll('input[name="visMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            visualizerSettings.mode = this.value;
            document.getElementById('bars-settings').style.display = this.value === 'bars' ? 'block' : 'none';
            document.getElementById('circle-settings').style.display = this.value === 'circle' ? 'block' : 'none';
            
            // 强制重绘，确保模式切换立即生效
            if (window.currentVisualizer) {
                // 重新启动可视化，确保使用新模式
                var analyser = window.currentVisualizer.analyser;
                if (analyser) {
                    // 取消当前的动画帧
                    if (window.currentVisualizer.animationId) {
                        cancelAnimationFrame(window.currentVisualizer.animationId);
                    }
                    // 重新绘制频谱
                    window.currentVisualizer._drawSpectrum(analyser);
                }
            }
        });
    });
    
    // 新增：圆形模式参数事件监听器
    document.getElementById('circleRadius').addEventListener('input', function(e) {
        visualizerSettings.circle.radius = parseInt(e.target.value);
        document.getElementById('radiusValue').textContent = visualizerSettings.circle.radius + 'px';
    });
    
    document.getElementById('rotationSpeed').addEventListener('input', function(e) {
        visualizerSettings.circle.rotationSpeed = parseFloat(e.target.value);
        document.getElementById('rotationValue').textContent = visualizerSettings.circle.rotationSpeed;
    });
    
    document.getElementById('barMultiplier').addEventListener('input', function(e) {
        visualizerSettings.circle.multiplier = parseFloat(e.target.value);
        document.getElementById('multiplierValue').textContent = visualizerSettings.circle.multiplier + 'x';
    });

    // 新增：圆形模式间隙控制
    document.getElementById('circleGap').addEventListener('input', function(e) {
        visualizerSettings.gap = parseInt(e.target.value);
        document.getElementById('circleGapValue').textContent = visualizerSettings.gap + 'px';
        // 同步更新条形模式的间隙控制
        document.getElementById('barGap').value = visualizerSettings.gap;
        document.getElementById('gapValue').textContent = visualizerSettings.gap + 'px';
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
        document.getElementById('heightValue').textContent = height + 'x';

        // 为圆形模式应用相应的预设设置
        if (visualizerSettings.mode === 'circle') {
            // 针对不同预设调整圆形参数
            if (top === '#0f0') { // classic
                visualizerSettings.circle.rotationSpeed = 0.005;
                visualizerSettings.circle.multiplier = 0.8;
            } else if (top === '#0080ff') { // neon
                visualizerSettings.circle.rotationSpeed = 0.01;
                visualizerSettings.circle.multiplier = 1.0;
            } else { // monochrome
                visualizerSettings.circle.rotationSpeed = 0.003;
                visualizerSettings.circle.multiplier = 0.6;
            }
            
            // 更新圆形控件UI
            document.getElementById('rotationSpeed').value = visualizerSettings.circle.rotationSpeed;
            document.getElementById('rotationValue').textContent = visualizerSettings.circle.rotationSpeed;
            
            document.getElementById('barMultiplier').value = visualizerSettings.circle.multiplier;
            document.getElementById('multiplierValue').textContent = visualizerSettings.circle.multiplier + 'x';
        }
    }

    // 新增：添加模式选择器的样式
    var modeSelector = document.querySelector('.mode-selector');
    if (modeSelector) {
        modeSelector.style.display = 'flex';
        modeSelector.style.gap = '10px';
        modeSelector.style.marginBottom = '5px';
    }
    
    // 新增：单选按钮样式
    var modeOptions = document.querySelectorAll('.mode-option');
    modeOptions.forEach(option => {
        option.style.display = 'flex';
        option.style.alignItems = 'center';
        option.style.gap = '5px';
        option.style.cursor = 'pointer';
        option.style.padding = '3px 0';
        
        // 获取单选按钮元素进行自定义样式
        const radio = option.querySelector('input[type="radio"]');
        if (radio) {
            radio.style.margin = '0';
            radio.style.cursor = 'pointer';
        }
        
        // 获取文本元素进行自定义样式
        const span = option.querySelector('span');
        if (span) {
            span.style.fontSize = '13px';
            span.style.cursor = 'pointer';
        }
    });
    
    // 如果是录制控件，确保它们位于合适位置
    var recordingControls = document.getElementById('recording_controls');
    if (recordingControls) {
        canvasContainer.appendChild(recordingControls);
    }
}

// 初始化录制功能
function initializeRecordingFeature() {
    // 检查是否已有控件容器
    var controlsContainer = document.getElementById('controls_container');
    if (!controlsContainer) {
        // 如果controls容器不存在，我们需要等待样式控制初始化
        setTimeout(initializeRecordingFeature, 100);
        return;
    }
    
    if (!document.getElementById('recording_controls')) {
        // 创建录制控件
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
        
        // 添加控件容器到视图
        controlsContainer.appendChild(recordingControls);
        
        // 添加样式
        var style = document.createElement('style');
        style.textContent = 
            '#recording_controls {' +
            '    text-align: center;' +
            '    margin: 0;' +
            '    display: flex;' +
            '    align-items: center;' +
            '    justify-content: center;' +
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

// 初始化播放控件 - 修改以适应新的布局
function initializePlaybackControls() {
    var controlsContainer = document.getElementById('controls_container');
    if (!controlsContainer) {
        // 如果controls容器不存在，可能样式控制尚未初始化，稍后再尝试
        setTimeout(initializePlaybackControls, 100);
        return;
    }
    
    if (!document.getElementById('playback_controls')) {
        // 创建播放控件
        var playbackControls = document.createElement('div');
        playbackControls.id = 'playback_controls';
        
        // 创建播放/暂停按钮
        var playPauseBtn = document.createElement('button');
        playPauseBtn.id = 'playPauseBtn';
        playPauseBtn.innerHTML = 'Pause';
        
        // 创建重新开始按钮
        var restartBtn = document.createElement('button');
        restartBtn.id = 'restartBtn';
        restartBtn.innerHTML = 'Restart';
        
        // 创建进度条容器
        var progressContainer = document.createElement('div');
        progressContainer.id = 'progress_container';
        
        // 创建进度条
        var progressBar = document.createElement('div');
        progressBar.id = 'progress_bar';
        progressContainer.appendChild(progressBar);
        
        // 创建时间显示
        var timeDisplay = document.createElement('span');
        timeDisplay.id = 'time_display';
        timeDisplay.innerHTML = '0:00 / 0:00';
        
        // 添加按钮和进度条到控件容器
        playbackControls.appendChild(playPauseBtn);
        playbackControls.appendChild(restartBtn);
        playbackControls.appendChild(progressContainer);
        playbackControls.appendChild(timeDisplay);
        
        // 添加到控件容器
        controlsContainer.appendChild(playbackControls);
        
        // 添加样式
        var style = document.createElement('style');
        style.textContent = 
            '#playback_controls {' +
            '    text-align: center;' +
            '    margin: 0;' +
            '    display: flex;' +
            '    align-items: center;' +
            '    justify-content: center;' +
            '    gap: 10px;' +
            '    width: 100%;' +
            '}' +
            '#playback_controls button {' +
            '    padding: 8px 16px;' +
            '    background-color: #444;' +
            '    color: white;' +
            '    border: none;' +
            '    border-radius: 4px;' +
            '    cursor: pointer;' +
            '}' +
            '#playback_controls button:hover {' +
            '    background-color: #555;' +
            '}' +
            '#playback_controls button:disabled {' +
            '    background-color: #333;' +
            '    color: #666;' +
            '    cursor: not-allowed;' +
            '}' +
            '#progress_container {' +
            '    flex: 1;' +
            '    height: 8px;' +
            '    background-color: #333;' +
            '    border-radius: 4px;' +
            '    position: relative;' +
            '    overflow: hidden;' +
            '    cursor: pointer;' +
            '}' +
            '#progress_bar {' +
            '    height: 100%;' +
            '    background: linear-gradient(to right, #4CAF50, #8BC34A);' +
            '    width: 0%;' +
            '    border-radius: 4px;' +
            '    transition: width 0.1s linear;' +
            '}' +
            '#time_display {' +
            '    color: #aaa;' +
            '    font-size: 12px;' +
            '    width: 100px;' +
            '    text-align: right;' +
            '}';
            
        document.head.appendChild(style);
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

    // 播放控制相关属性
    this.isPlaying = false; // 是否正在播放
    this.startTime = 0; // 开始播放的时间戳
    this.pausedAt = 0; // 在何时暂停
    this.decodedBuffer = null; // 存储解码后的音频缓冲区
    this.duration = 0; // 音频总时长
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

                // 保存解码后的音频缓冲区
                that.decodedBuffer = buffer;
                that.duration = buffer.duration;
                
                // 更新时间显示
                var timeDisplay = document.getElementById('time_display');
                if (timeDisplay) {
                    timeDisplay.textContent = '0:00 / ' + that._formatTime(that.duration);
                }
                
                // 初始化播放控件事件
                that._initPlaybackControls();

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

    _initPlaybackControls: function() {
        var that = this;
        var playPauseBtn = document.getElementById('playPauseBtn');
        var restartBtn = document.getElementById('restartBtn');
        var progressContainer = document.getElementById('progress_container');
        var progressBar = document.getElementById('progress_bar');
        
        if (playPauseBtn) {
            playPauseBtn.onclick = function() {
                if (that.isPlaying) {
                    that.pauseAudio();
                    // 暂停时启用restart和进度条
                    if (restartBtn) restartBtn.disabled = false;
                    if (progressContainer) progressContainer.classList.remove('disabled');
                    progressContainer.style.pointerEvents = "auto";
                } else {
                    that.resumeAudio();
                    // 播放时禁用restart和进度条
                    if (restartBtn) restartBtn.disabled = true;
                    if (progressContainer) progressContainer.classList.add('disabled');
                    progressContainer.style.pointerEvents = "none";
                }
            };
        }
        
        if (restartBtn) {
            restartBtn.onclick = function() {
                that.restartAudio();
                // 重启后立即禁用restart和进度条
                restartBtn.disabled = true;
                if (progressContainer) {
                    progressContainer.classList.add('disabled');
                    progressContainer.style.pointerEvents = "none";
                }
            };
        }
        
        if (progressContainer) {
            progressContainer.addEventListener('mousedown', function(e) {
                // 如果正在播放，不处理点击
                if (that.isPlaying) return;
                // 阻止事件冒泡和默认行为
                e.preventDefault();
                e.stopPropagation();

                var rect = progressContainer.getBoundingClientRect();
                var pos = Math.min(Math.max(0, (e.clientX - rect.left) / rect.width), 1);
                that.seekAudio(pos * that.duration);
                
                // 跳转后禁用restart和进度条
                if (restartBtn) restartBtn.disabled = true;
                progressContainer.classList.add('disabled');
                progressContainer.style.pointerEvents = "none";
            });
        }

        // 开始时禁用控件
        if (restartBtn) restartBtn.disabled = true;
        if (progressContainer) {
            progressContainer.classList.add('disabled');
            progressContainer.style.pointerEvents = "none";
        }
        
        // 添加禁用样式
        var style = document.createElement('style');
        style.textContent = `
            #progress_container.disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
        `;
        document.head.appendChild(style);
        
        // 启动进度更新
        this._startProgressUpdate();
    },

    _startProgressUpdate: function() {
        var that = this;
        var progressBar = document.getElementById('progress_bar');
        var timeDisplay = document.getElementById('time_display');
        
        function updateProgress() {
            if (that.source && that.isPlaying) {
                var currentTime = that.audioContext.currentTime - that.startTime + that.pausedAt;
                if (currentTime <= that.duration) {
                    var percent = (currentTime / that.duration) * 100;
                    if (progressBar) progressBar.style.width = percent + '%';
                    if (timeDisplay) timeDisplay.textContent = that._formatTime(currentTime) + ' / ' + that._formatTime(that.duration);
                }
            }
            requestAnimationFrame(updateProgress);
        }
        
        updateProgress();
    },
    
    _formatTime: function(seconds) {
        var minutes = Math.floor(seconds / 60);
        var secs = Math.floor(seconds % 60);
        return minutes + ':' + (secs < 10 ? '0' : '') + secs;
    },
    
    pauseAudio: function() {
        if (this.source && this.isPlaying) {
            this.source.stop(0);
            this.pausedAt += this.audioContext.currentTime - this.startTime;
            this.isPlaying = false;
            this.status = 0; // 更新状态让可视化器知道应该停止
            
            // 更新按钮文本
            var playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) playPauseBtn.innerHTML = 'Play';

            // 启用restart和进度条
            var restartBtn = document.getElementById('restartBtn');
            var progressContainer = document.getElementById('progress_container');
            if (restartBtn) restartBtn.disabled = false;
            if (progressContainer) {
                progressContainer.classList.remove('disabled');
                progressContainer.style.pointerEvents = "auto";
            }
        }
    },

    resumeAudio: function() {
        if (this.decodedBuffer && !this.isPlaying) {
            this._visualize(this.audioContext, this.decodedBuffer, this.pausedAt);
            this.isPlaying = true;
            
            // 更新按钮文本
            var playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) playPauseBtn.innerHTML = 'Pause';
        }
    },
    
    restartAudio: function() {
        if (this.decodedBuffer) {
            try {
                // 如果正在播放，先停止
                if (this.source) {
                    this.forceStop = true; // 标记为强制停止，避免触发onended事件
                    this.source.stop(0);
                    this.source = null;
                }
                
                // 确保取消现有的动画帧
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
                
                // 清空画布，确保没有残留
                var canvas = document.getElementById('canvas');
                if (canvas) {
                    var ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                // 重置状态并重新开始
                this.pausedAt = 0;
                this.status = 1;
                this.isPlaying = true;
                this.forceStop = false; // 重置强制停止标记
                
                // 确保音频上下文处于正确状态
                if (this.audioContext.state === 'suspended') {
                    var self = this;
                    this.audioContext.resume().then(function() {
                        self._visualize(self.audioContext, self.decodedBuffer, 0);
                    });
                } else {
                    this._visualize(this.audioContext, this.decodedBuffer, 0);
                }
                
                // 更新按钮文本
                var playPauseBtn = document.getElementById('playPauseBtn');
                if (playPauseBtn) playPauseBtn.innerHTML = 'Pause';
                
                // 确保进度条恢复至起始位置
                var progressBar = document.getElementById('progress_bar');
                if (progressBar) progressBar.style.width = '0%';
                
                // 更新时间显示
                var timeDisplay = document.getElementById('time_display');
                if (timeDisplay) {
                    timeDisplay.textContent = '0:00 / ' + this._formatTime(this.duration);
                }
            } catch (e) {
                console.error('Error restarting audio:', e);
                this._recoverFromError();
            }
        }
    },
    
    seekAudio: function(newPosition) {
        if (this.decodedBuffer) {
            try {
                // 设置强制停止标志，防止触发onended事件
                this.forceStop = true;
                
                // 停止当前播放
                if (this.source) {
                    this.source.stop(0);
                    this.source = null;
                }
                
                // 确保取消当前的动画帧
                if (this.animationId) {
                    cancelAnimationFrame(this.animationId);
                    this.animationId = null;
                }
                
                // 清空画布，确保没有残留
                var canvas = document.getElementById('canvas');
                if (canvas) {
                    var ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
                
                // 重置强制停止标志
                this.forceStop = false;
                
                // 更新状态
                this.pausedAt = newPosition;
                this.status = 1;
                this.isPlaying = true;
                
                // 确保音频上下文处于正确状态
                var self = this;
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume().then(function() {
                        self._visualize(self.audioContext, self.decodedBuffer, newPosition);
                    });
                } else {
                    this._visualize(this.audioContext, this.decodedBuffer, newPosition);
                }
                
                // 更新UI
                var playPauseBtn = document.getElementById('playPauseBtn');
                if (playPauseBtn) playPauseBtn.innerHTML = 'Pause';
                
                // 更新进度条
                var progressBar = document.getElementById('progress_bar');
                if (progressBar) {
                    var percent = (newPosition / this.duration) * 100;
                    progressBar.style.width = percent + '%';
                }
                
                // 更新时间显示
                var timeDisplay = document.getElementById('time_display');
                if (timeDisplay) {
                    timeDisplay.textContent = this._formatTime(newPosition) + ' / ' + this._formatTime(this.duration);
                }
            } catch (e) {
                console.error('Error seeking audio:', e);
                this._recoverFromError();
            }
        }
    },

    // 新增辅助方法，专门处理seek后的新播放创建
    _createNewPlayback: function(startPosition) {
        if (!this.decodedBuffer) return;
        
        try {
            // 创建新的音频节点
            var audioBufferSourceNode = this.audioContext.createBufferSource();
            var analyser = this.audioContext.createAnalyser();
            
            audioBufferSourceNode.connect(analyser);
            analyser.connect(this.audioContext.destination);
            audioBufferSourceNode.buffer = this.decodedBuffer;
            
            // 从指定位置开始播放
            audioBufferSourceNode.start(0, startPosition);
            
            // 更新状态和引用
            this.startTime = this.audioContext.currentTime;
            this.source = audioBufferSourceNode;
            this.analyser = analyser;
            this.isPlaying = true;
            this.status = 1;
            
            // 设置结束处理
            var that = this;
            audioBufferSourceNode.onended = function() {
                if (that.isPlaying && !that.forceStop) {
                    that._audioEnd(that);
                }
            };
            
            // 清空并重新开始绘制频谱
            this._drawSpectrum(analyser);
            
            // 更新UI
            var playPauseBtn = document.getElementById('playPauseBtn');
            if (playPauseBtn) playPauseBtn.innerHTML = 'Pause';
        } catch (error) {
            console.error('Failed to create new playback:', error);
            this._recoverFromError();
        }
    },

    // 错误恢复方法
    _recoverFromError: function() {
        // 重置所有状态
        this.pausedAt = 0;
        this.isPlaying = false;
        this.status = 0;
        this.source = null;
        
        // 取消任何活动的动画
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 清空画布
        var canvas = document.getElementById('canvas');
        if (canvas) {
            var ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        
        // 更新UI
        var playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) playPauseBtn.innerHTML = 'Play';
        
        var progressBar = document.getElementById('progress_bar');
        if (progressBar) progressBar.style.width = '0%';
        
        // 显示错误信息
        this._updateInfo('Playback error occurred. Please reload or try another file.', false);
    },

    // 修改_visualize函数以更好地处理状态变化
    _visualize: function(audioContext, buffer, startOffset = 0) {
        try {
            // 确保音频上下文处于运行状态
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            var audioBufferSouceNode = audioContext.createBufferSource(),
                analyser = audioContext.createAnalyser(),
                that = this;
                
            // 设置分析器参数以获得更好的频谱效果
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            
            // 连接节点
            audioBufferSouceNode.connect(analyser);
            analyser.connect(audioContext.destination);
            audioBufferSouceNode.buffer = buffer;
            
            // 记录开始时间用于计算进度
            this.startTime = audioContext.currentTime;
            this.isPlaying = true;
            
            // 设置播放API兼容性
            if (!audioBufferSouceNode.start) {
                audioBufferSouceNode.start = audioBufferSouceNode.noteOn;
                audioBufferSouceNode.stop = audioBufferSouceNode.noteOff;
            }
            
            // 从指定位置开始播放
            audioBufferSouceNode.start(0, startOffset);
            
            this.status = 1;
            this.source = audioBufferSouceNode;
            
            // 处理播放结束事件
            audioBufferSouceNode.onended = function() {
                if (that.isPlaying && !that.forceStop) {
                    that._audioEnd(that);
                } else {
                    that.forceStop = false;
                }
            };
            
            this._updateInfo('Playing ' + this.fileName, false);
            this.info = 'Playing ' + this.fileName;
            document.getElementById('fileWrapper').style.opacity = 0.2;
            
            // 保存analyser引用以便模式切换时使用
            this.analyser = analyser;
            window.currentVisualizer = this;
            
            // 确保先清除画布，再开始绘制
            var canvas = document.getElementById('canvas');
            if (canvas) {
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
            
            // 启动频谱绘制
            this._drawSpectrum(analyser);
        } catch (e) {
            console.error('Error during visualization:', e);
            this._updateInfo('Error playing audio. Try reloading.', false);
            this._recoverFromError();
        }
    },

    // 修改 _audioEnd 方法以适应新的控制
    _audioEnd: function(instance) {
        if (this.forceStop) {
            this.forceStop = false;
            this.status = 1;
            return;
        };
        this.status = 0;
        this.isPlaying = false;
        this.pausedAt = 0;
        
        // 更新按钮状态
        var playPauseBtn = document.getElementById('playPauseBtn');
        if (playPauseBtn) playPauseBtn.innerHTML = 'Play';

        // 启用restart和进度条
        var restartBtn = document.getElementById('restartBtn');
        var progressContainer = document.getElementById('progress_container');
        if (restartBtn) restartBtn.disabled = false;
        if (progressContainer) {
            progressContainer.classList.remove('disabled');
            progressContainer.style.pointerEvents = "auto";
        }
        
        // 确保我们清除当前的可视化，包括圆形可视化
        if (this.animationId !== null) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
            
            // 清除画布
            var canvas = document.getElementById('canvas');
            if (canvas) {
                var ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        }
        
        var text = 'HTML5 Audio API | An Audio Visualizer';
        document.getElementById('fileWrapper').style.opacity = 1;
        document.getElementById('info').innerHTML = text;
        instance.info = text;
        document.getElementById('uploadedFile').value = '';
    },

    _drawSpectrum: function(analyser) {
        // 确保取消之前的动画帧
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        var that = this,
            canvas = document.getElementById('canvas'),
            cwidth = canvas.width,
            cheight = canvas.height - 2
            capYPositionArray = []; // store the vertical position of caps for the previous frame
        
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, cwidth, cheight); // 确保画布是干净的

        //  // 保存analyser引用以便模式切换时使用
        // this.analyser = analyser;
        // // 保存visualizer实例的全局引用，用于模式切换
        // window.currentVisualizer = this;

        // 根据当前可视化模式选择绘制函数
        if (visualizerSettings.mode === 'circle') {
            // 圆形频谱绘制
            var rotation = 0; // 初始旋转角度
            var capArray = []; // 存储圆形频谱的帽子位置
            
            var drawCircle = function() {
                // 检查播放状态
                if (that.status === 0 && !that.isPlaying) {
                    ctx.clearRect(0, 0, cwidth, cheight);
                    return;
                }

                // 清除画布
                ctx.clearRect(0, 0, cwidth, cheight);

                // 获取圆形可视化的设置
                var radius = visualizerSettings.circle.radius;
                var barCount = visualizerSettings.circle.barCount;
                var multiplier = visualizerSettings.circle.multiplier;
                var centerX = cwidth / 2;
                var centerY = cheight / 2;
                var meterWidth = visualizerSettings.meterWidth;
                var gap = visualizerSettings.gap; // 使用全局间隙设置
                var capHeight = visualizerSettings.circle.capHeight || 1; // 默认为1如果没有设置
                
                // 获取频谱数据
                var array = new Uint8Array(analyser.frequencyBinCount);
                analyser.getByteFrequencyData(array);
                
                // 处理音频停止的情况
                if (that.status === 0) {
                    for (var i = array.length - 1; i >= 0; i--) {
                        array[i] = 0;
                    };
                    
                    var allCapsReachBottom = true;
                    for (var i = capArray.length - 1; i >= 0; i--) {
                        allCapsReachBottom = allCapsReachBottom && (capArray[i] === 0);
                    };
                    
                    if (allCapsReachBottom) {
                        cancelAnimationFrame(that.animationId);
                        ctx.clearRect(0, 0, cwidth, cheight); // 确保清除画布
                        return;
                    };
                };

                // 检查可视化模式是否已更改
                if (visualizerSettings.mode !== 'circle') {
                    // 如果模式已更改，重新启动可视化
                    cancelAnimationFrame(that.animationId);
                    that._drawSpectrum(analyser);
                    return;
                }
                
                // 计算频谱步长
                // var step = Math.round(array.length / barCount);
                var step = array.length / barCount;
                
                // 更新旋转角度
                rotation += visualizerSettings.circle.rotationSpeed;
                if (rotation >= Math.PI * 2) {
                    rotation = 0;
                }
                
                // 创建径向渐变
                var gradient = ctx.createLinearGradient(0, 0, 0, cheight);
                gradient.addColorStop(1, visualizerSettings.colors.top);
                gradient.addColorStop(0.5, visualizerSettings.colors.middle);
                gradient.addColorStop(0, visualizerSettings.colors.bottom);
                
                // 绘制背景圆
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // 绘制频谱条
                for (var i = 0; i < barCount; i++) {
                    // 计算当前频谱条的角度（加上旋转角度和间隙）
                    var angle = (i * 2 * Math.PI / barCount) + rotation;

                    // 获取当前频率值，使用插值平滑采样
                    var dataIndex = i * step;
                    var index = Math.floor(dataIndex);
                    var fraction = dataIndex - index;
                    
                    // 使用线性插值获取更准确的频率值
                    var value;
                    if (index + 1 < array.length) {
                        value = array[index] * (1 - fraction) + array[index + 1] * fraction;
                    } else {
                        value = array[index];
                    }
                    
                    // 获取当前频率值并应用高度缩放
                    // var value = array[i * step] * visualizerSettings.heightScale * multiplier;
                    // 应用高度缩放
                    value = value * visualizerSettings.heightScale * multiplier;
                    if (value > radius) value = radius; // 限制最大高度
                    
                    // 初始化capArray
                    if (capArray.length < barCount) {
                        capArray.push(value);
                    };
                    
                    // 计算频谱条的起点和终点
                    var innerX = centerX + Math.cos(angle) * radius;
                    var innerY = centerY + Math.sin(angle) * radius;
                    var outerX = centerX + Math.cos(angle) * (radius + value);
                    var outerY = centerY + Math.sin(angle) * (radius + value);
                    
                    // 绘制频谱条
                    ctx.beginPath();
                    ctx.moveTo(innerX, innerY);
                    ctx.lineTo(outerX, outerY);
                    ctx.lineWidth = Math.max(1, meterWidth - gap); // 应用间隙
                    ctx.strokeStyle = gradient;
                    ctx.stroke();
                    
                    // 更新capArray
                    if (value < capArray[i]) {
                        capArray[i] = capArray[i] - 1;
                    } else {
                        capArray[i] = value;
                    }
                    
                    var capX = centerX + Math.cos(angle) * (radius + capArray[i]);
                    var capY = centerY + Math.sin(angle) * (radius + capArray[i]);

                    // 绘制顶端小帽
                    ctx.fillStyle = visualizerSettings.capColor;
                    ctx.beginPath();
                    ctx.arc(capX, capY, capHeight, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                // 绘制中心小圆
                // ctx.beginPath();
                // ctx.arc(centerX, centerY, radius * 0.2, 0, Math.PI * 2);
                // ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                // ctx.fill();
                
                that.animationId = requestAnimationFrame(drawCircle);
            };
            
            this.animationId = requestAnimationFrame(drawCircle);
        } else {
            // 原始的条形图频谱绘制
            var drawMeter = function() {
                // 检查播放状态
                if (that.status === 0 && !that.isPlaying) {
                    ctx.clearRect(0, 0, cwidth, cheight);
                    return;
                }
                // 使用当前样式设置
                var meterWidth = visualizerSettings.meterWidth;
                var gap = visualizerSettings.gap;
                var capHeight = visualizerSettings.capHeight;
                var capStyle = visualizerSettings.capColor;
                var meterNum = Math.floor(cwidth / (meterWidth + gap));
                var heightScale = visualizerSettings.heightScale;

                // 检查可视化模式是否已更改
                if (visualizerSettings.mode !== 'bars') {
                    // 如果模式已更改，重新启动可视化
                    cancelAnimationFrame(that.animationId);
                    that._drawSpectrum(analyser);
                    return;
                }

                // 清除画布
                ctx.clearRect(0, 0, cwidth, cheight);
                
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
        }
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