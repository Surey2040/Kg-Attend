// ExtendScript for Adobe After Effects
// Cinematic Title Automation with Graceful Plugin Checking

app.beginUndoGroup("Cinematic Title Setup");

try {
    // 1. Create a new Composition
    var compName = "Cinematic Intro";
    var compWidth = 1920;
    var compHeight = 1080;
    var compPixelAspect = 1;
    var compDuration = 10; // 10 seconds
    var compFramerate = 30;

    var mainComp = app.project.items.addComp(compName, compWidth, compHeight, compPixelAspect, compDuration, compFramerate);
    mainComp.openInViewer();

    // 2. Add Background Solid
    var bgLayer = mainComp.layers.addSolid([0.05, 0.05, 0.05], "Background", compWidth, compHeight, compPixelAspect, compDuration);
    
    // 3. Add Text Layer
    var textLayer = mainComp.layers.addText("CINEMATIC TITLE");
    var textProp = textLayer.property("Source Text");
    var textDoc = textProp.value;
    textDoc.fontSize = 150;
    textDoc.fillColor = [1, 1, 1];
    textDoc.justification = ParagraphJustification.CENTER_JUSTIFY;
    textProp.setValue(textDoc);
    
    // Center anchor point (approximation for text)
    textLayer.property("Position").setValue([compWidth/2, compHeight/2, 0]);
    textLayer.threeDLayer = true;

    // Animate Text Scale and Opacity
    textLayer.property("Scale").setValueAtTime(0, [80, 80, 80]);
    textLayer.property("Scale").setValueAtTime(10, [110, 110, 110]);
    
    textLayer.property("Opacity").setValueAtTime(0, 0);
    textLayer.property("Opacity").setValueAtTime(2, 100);
    textLayer.property("Opacity").setValueAtTime(8, 100);
    textLayer.property("Opacity").setValueAtTime(10, 0);

    // 4. Add Camera with smooth dolly movement
    var cameraLayer = mainComp.layers.addCamera("Main Camera", [compWidth/2, compHeight/2]);
    cameraLayer.property("Position").setValueAtTime(0, [compWidth/2, compHeight/2, -1500]);
    cameraLayer.property("Position").setValueAtTime(10, [compWidth/2, compHeight/2, -800]);

    // Enable Global and Layer Motion Blur
    mainComp.motionBlur = true;
    textLayer.motionBlur = true;

    // ----------------------------------------------------
    // Plugin Application Helper Function
    // ----------------------------------------------------
    function applyPlugin(layer, matchName) {
        if (layer.property("Effects").canAddProperty(matchName)) {
            return layer.property("Effects").addProperty(matchName);
        }
        return null;
    }

    // A. Apply Deep Glow (if installed)
    var glowFx = applyPlugin(textLayer, "Deep Glow");
    if (glowFx) {
        glowFx.property("Radius").setValue(200);
        glowFx.property("Exposure").setValue(0.8);
    }

    // B. Create a Solid for Saber and Optical Flares
    var fxLayer = mainComp.layers.addSolid([0, 0, 0], "FX Layer", compWidth, compHeight, compPixelAspect, compDuration);
    fxLayer.blendingMode = BlendingMode.SCREEN;

    // C. Apply Saber (if installed)
    var saberFx = applyPlugin(fxLayer, "VideoCopilot Saber");
    if (saberFx) {
        // Set to transparent background in Saber
        saberFx.property("Render Settings").property("Composite Settings").setValue(2); // 2 usually equals Transparent
        saberFx.property("Glow Intensity").setValue(50);
    }

    // D. Apply Optical Flares (if installed)
    var flareFx = applyPlugin(fxLayer, "VideoCopilot OpticalFlares");
    if (flareFx) {
        // Animate flare sweeping across screen
        flareFx.property("Position XY").setValueAtTime(0, [-200, compHeight/2]);
        flareFx.property("Position XY").setValueAtTime(10, [compWidth + 200, compHeight/2]);
        flareFx.property("Brightness").setValue(120);
        flareFx.property("Render Mode").setValue(2); // On Transparent
    }

    // E. Apply Element 3D (if installed)
    var e3dLayer = mainComp.layers.addSolid([0, 0, 0], "Element 3D", compWidth, compHeight, compPixelAspect, compDuration);
    var e3dFx = applyPlugin(e3dLayer, "VideoCopilot Element");
    if (e3dFx) {
        // Element 3D is applied, but user must manually open Scene Setup to assign models/materials.
    }

    // ----------------------------------------------------
    // Import User Logo
    // ----------------------------------------------------
    var logoFile = File.openDialog("Select your logo image to import into the composition:");
    if (logoFile != null) {
        var importOptions = new ImportOptions(logoFile);
        if (importOptions.canImportAs(ImportAsType.FOOTAGE)) {
            var logoItem = app.project.importFile(importOptions);
            var logoLayer = mainComp.layers.add(logoItem);
            
            logoLayer.threeDLayer = true;
            logoLayer.motionBlur = true;
            
            // Basic Logo Animation
            logoLayer.property("Opacity").setValueAtTime(0, 0);
            logoLayer.property("Opacity").setValueAtTime(2, 100);
            logoLayer.property("Position").setValue([compWidth/2, compHeight/2 - 200, 0]);
            
            // Move it above the background but below text
            logoLayer.moveBefore(textLayer);
        }
    }

    alert("Cinematic Composition generated successfully!\nPlugins were skipped gracefully if they weren't found on your system.");

} catch (err) {
    alert("An error occurred: " + err.toString());
}

app.endUndoGroup();
