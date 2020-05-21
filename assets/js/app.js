const cam = document.getElementById("cam");

const startCam = () => {
    //verificando se existe um dispositivo do tipo camera
    navigator.mediaDevices.enumerateDevices()
        .then(devices => {
            if(Array.isArray(devices)){
                devices.forEach(device => {
                    if(device.kind === 'videoinput'){
                        navigator.getUserMedia(
                            {
                                video: {
                                    deviceId: device.deviceId
                                }
                            },
                            stream => cam.srcObject = stream,
                            error => console.error(error)
                        )
                    }
                })
            }
        })
}

Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri('/assets/lib/models/'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/assets/lib/models/'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/assets/lib/models/'),
    faceapi.nets.faceExpressionNet.loadFromUri('/assets/lib/models/'),
    faceapi.nets.ageGenderNet.loadFromUri('/assets/lib/models/'),
    faceapi.nets.ssdMobilenetv1.loadFromUri('/assets/lib/models/')
]).then(startCam);


cam.addEventListener('play', async() => {
    const canvas = faceapi.createCanvasFromMedia(cam)
    const canvasSize = {
        width: cam.width,
        height: cam.height
    }
    faceapi.matchDimensions(canvas, canvasSize)
    document.body.appendChild(canvas)
    setInterval(async () => {
        const detections = await faceapi
            .detectAllFaces(
                cam, 
                new faceapi.TinyFaceDetectorOptions()
            )
            .withFaceLandmarks()
            .withFaceExpressions()
            .withAgeAndGender()
        const resizedDetections = faceapi.resizeResults(detections, canvasSize)
        canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height)
        faceapi.draw.drawDetections(canvas, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

        //identificacao de idade e genero
        resizedDetections.forEach(detection => {
            const { age, gender, genderProbability } = detection
            new faceapi.draw.DrawTextField([
                `${parseInt(age, 10)} years`,
                `${gender} (${parseInt(genderProbability * 100, 10)})%`
            ], detection.detection.box.topRight).draw(canvas)
        })
        
    }, 100)
});
