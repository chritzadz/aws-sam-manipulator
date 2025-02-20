var url_id;
var fileName;
let dataArray = [];

function urlParam(sParam) {
    var sPageURL = window.location.search.substring(1);
    var sURLVariables = sPageURL.split('&');
    for (var i = 0; i < sURLVariables.length; i++) {
        var sParameterName = sURLVariables[i].split('=');
        if (sParameterName[0] == sParam) {
            return sParameterName[1];
        }
    }
}

function writeValue(val) {
    fileName = val;
}

function loadCSVFile() {
    return new Promise((resolve, reject) => {
        fetch('data.csv')
            .then(response => response.text())
            .then(data => {
                const rows = data.split(/\r?\n/);
                const headers = rows[0].split(',');

                dataArray = rows.slice(1).map(row => {
                    const values = row.split(',');
                    if (values.length === headers.length) {
                        return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
                    }
                    return null;
                }).filter(Boolean);

                resolve(); // Resolve the Promise when data is loaded
            })
            .catch(error => {
                console.error('Error loading CSV:', error);
                reject(error); // Reject on error
            });
    });
}

function findModelById(id) {
    return dataArray.find(entry => entry.id === id);
}

document.addEventListener('DOMContentLoaded', function () {
    var canvas = document.getElementById("renderCanvas");
    var engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
    var filePath = "models/";
    var fileType = '.glb';

    var url_id = urlParam('id');
    console.log(url_id);

    loadCSVFile().then(() => {
        const result = findModelById(url_id);
        fileName = result.model;

        startLoadingModel();
    });

    function startLoadingModel() {
        if (!fileName) {
            console.log("Model file name is undefined.");
            return;
        }

        console.log('Starting to load model:', filePath + fileName + fileType);

        const mainScene = function () {
            var scene = new BABYLON.Scene(engine);

            // Lighting setup
            var light = new BABYLON.HemisphericLight("Hemispheric", new BABYLON.Vector3(0, 1, 0), scene);
            light.intensity = 1.25;

            // Camera setup
            var camera = new BABYLON.ArcRotateCamera("Camera", radians(90), radians(90), 3, BABYLON.Vector3.Zero(), scene);
            camera.attachControl(canvas, false);
            camera.allowUpsideDown = false;

            camera.lowerRadiusLimit = 0.5;
            camera.upperRadiusLimit = 10;
            camera.lowerBetaLimit = radians(10);
            camera.upperBetaLimit = radians(80);

            // GUI setup
            var myGUI = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
            var loadingText = new BABYLON.GUI.TextBlock();
            loadingText.text = "Loading...";
            loadingText.color = "black";
            loadingText.fontSize = 24;
            loadingText.fontStyle = "bold";
            myGUI.addControl(loadingText);

            // Load the model
            BABYLON.SceneLoader.ImportMesh("", filePath, fileName + fileType, scene, function (newMeshes) {
                camera.target = newMeshes[0];
                newMeshes[0].position = new BABYLON.Vector3(0, 0, 0);
                var scale = 0.01;
                newMeshes[0].scaling = new BABYLON.Vector3(scale, scale, scale);

                myGUI.removeControl(loadingText); // Hide loading text
            });

            return scene;
        }

        var scene = mainScene();

        // Run the render loop
        engine.runRenderLoop(function () {
            if (scene) {
                scene.render();
                scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
            }
        });
    }

    // Resize event listener
    window.addEventListener("resize", function () {
        engine.resize();
    });
});

// Utility function to convert degrees to radians
function radians(degree) {
    return degree * (Math.PI / 180);
}

function adjustModelScale(mesh) {
    var boundingBox = mesh.getBoundingInfo().boundingBox;
    var size = boundingBox.extendSize;

    var scale = 1 / Math.max(size.x, size.y, size.z);
    mesh.scaling.scaleInPlace(scale);
}