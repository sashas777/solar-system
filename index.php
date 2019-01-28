<?php
/**
 * Created by PhpStorm.
 * User: Sashas
 * Date: 12/27/2018
 * Time: 7:23 PM
 */
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8" />
    <title>Solar System</title>
    <link href="/files/styles.css" rel="stylesheet" />
    <style>
        html, body { background: url(im/sky.png) black }
    </style>
    <script src="/files/js/atom.js"></script>
    <script src="/files/js/libcanvas.js"></script>
</head>
<body>
<script>
    new function () {
        LibCanvas.extract();
        atom.patching(window);

        atom.dom(function () {
            new Solar.Controller();
        });
    };
</script>

<script src="js/controller.js"></script>
<script src="js/sun.js"></script>
<script src="js/info.js"></script>
<script src="js/planet.js"></script>
<script src="js/orbit.js"></script>
</body>
</html>