$(document).ready(function() {
    let layoutId = 0;
    let selectedElement = null;
    let undoStack = [];

    function debug(message) {
        console.log(message);
        $('#debug-output').append(`<p>${message}</p>`);
    }

    debug("Script loaded");

    // Check if element editor exists
if ($('#element-editor').length) {
    debug("Element editor found in DOM");
} else {
    debug("ERROR: Element editor not found in DOM");
}

    function createContainer(type, parent) {
        layoutId++;
        const name = type.charAt(0).toUpperCase() + type.slice(1) + layoutId;
        debug(`Creating ${type}: ${name}`);
        const $element = $(`<div id="layout-${layoutId}" class="${type}" data-name="${name}">${name}</div>`);
        
        if (type === 'column' && !parent.hasClass('row')) {
            const $row = createContainer('row', parent);
            $row.append($element);
        } else {
            parent.append($element);
        }

        $element.on('click', function(e) {
            e.stopPropagation();
            selectElement($(this));
        });

        addToUndoStack();
        return $element;
    }

    function updateElementName($element, name) {
        $element.attr('data-name', name);
        $element.text(name);
        debug(`Updated element name: ${name}`);
    }

    function selectElement($element) {
        debug(`Selecting element: ${$element.attr('data-name')}`);
        $('.selected').removeClass('selected');
        $element.addClass('selected');
        selectedElement = $element;

        $('#element-name').text($element.attr('data-name'));
        $('#element-custom-name').val($element.attr('data-name'));        $('#width').val($element.css('width'));
        $('#height').val($element.css('height'));
        $('#padding').val($element.css('padding'));
        $('#margin').val($element.css('margin'));
        $('#border-width').val($element.css('border-width'));
        $('#border-style').val($element.css('border-style'));
        $('#border-color').val(rgb2hex($element.css('border-color')));
        $('#bg-color').val(rgb2hex($element.css('background-color')));
        $('#bg-image').val($element.css('background-image').replace(/url\(['"]?(.+?)['"]?\)/i, '$1'));
        $('#bg-repeat').val($element.css('background-repeat'));
        $('#horizontal-align').val($element.css('text-align'));
        $('#vertical-align').val($element.css('vertical-align'));
        $('#border-radius').val($element.css('border-radius'));

        $('#element-editor').show();
        debug("Element editor should be visible now");
        
        // Check if element editor is actually visible
        if ($('#element-editor').is(':visible')) {
            debug("Element editor is confirmed visible");
        } else {
            debug("ERROR: Element editor is still hidden");
        }
    }

    function clearElementEditor() {
        $('#element-name').text('No element selected');
        $('#element-custom-name').val('');
        $('#width').val('');
        $('#height').val('');
        $('#padding').val('');
        $('#margin').val('');
        $('#border-width').val('');
        $('#border-style').val('');
        $('#border-color').val('');
        $('#bg-color').val('');
        $('#bg-image').val('');
        $('#bg-repeat').val('');
        $('#horizontal-align').val('');
        $('#vertical-align').val('');
        $('#border-radius').val('');
        debug("Element editor cleared");
    }

    function rgb2hex(rgb) {
        if (!rgb) return ''; // Return empty string if rgb is null or undefined
        if (rgb.startsWith('rgb')) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
            if (rgb && rgb.length === 4) {
                return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
            }
        }
        return rgb;
    }

    function hex(x) {
        return ("0" + parseInt(x).toString(16)).slice(-2);
    }

    function addToUndoStack() {
        undoStack.push($('#layout-preview').html());
        if (undoStack.length > 20) {
            undoStack.shift();
        }
    }

    function updateCSSOutput() {
        let css = '';
        $('#layout-preview').find('.container, .row, .column').each(function() {
            const id = $(this).attr('id');
            const styles = $(this).attr('style');
            if (styles) {
                css += `#${id} { ${styles} }\n`;
            }
        });
        $('#css-output').text(css);
        debug("CSS output updated");
    }

    function reattachEvents() {
        $('#layout-preview').find('.container, .row, .column').each(function() {
            $(this).on('click', function(e) {
                e.stopPropagation();
                selectElement($(this));
            });
        });
    }

    $('#add-container').on('click', function() {
        debug("Add container clicked");
        const $container = createContainer('container', $('#layout-preview'));
        selectElement($container);
    });

    $('#add-row').on('click', function() {
        debug("Add row clicked");
        if (selectedElement) {
            const $row = createContainer('row', selectedElement);
            selectElement($row);
        } else {
            debug("No element selected for adding row");
        }
    });

    $('#add-column').on('click', function() {
        debug("Add column clicked");
        if (selectedElement) {
            const $column = createContainer('column', selectedElement);
            selectElement($column);
        } else {
            debug("No element selected for adding column");
        }
    });

    $('#undo').on('click', function() {
        if (undoStack.length > 1) {
            undoStack.pop(); // Remove current state
            const previousState = undoStack.pop();
            $('#layout-preview').html(previousState);
            reattachEvents();
            debug("Undo performed");
        } else {
            debug("Nothing to undo");
        }
    });

    $('#delete-element').on('click', function() {
        if (selectedElement) {
            selectedElement.remove();
            selectedElement = null;
            clearElementEditor();
            addToUndoStack();
            debug("Element deleted");
        } else {
            debug("No element selected for deletion");
        }
    });

    $(document).on('keydown', function(e) {
        if (e.key === 'Delete' && selectedElement) {
            selectedElement.remove();
            selectedElement = null;
            clearElementEditor();
            addToUndoStack();
            debug("Element deleted with Delete key");
        }
    });

    $('#apply-styles').on('click', function() {
        debug("Apply styles clicked");
        if (selectedElement) {
            const customName = $('#element-custom-name').val();
            updateElementName(selectedElement, customName);

            selectedElement.css({
                width: $('#width').val() + $('#width-unit').val(),
                height: $('#height').val() + $('#height-unit').val(),
                padding: $('#padding').val(),
                margin: $('#margin').val(),
                borderWidth: $('#border-width').val(),
                borderStyle: $('#border-style').val(),
                borderColor: $('#border-color').val(),
                backgroundColor: $('#bg-color').val(),
                backgroundImage: $('#bg-gradient').val() || ($('#bg-image').val() ? `url(${$('#bg-image').val()})` : ''),
                backgroundRepeat: $('#bg-repeat').val(),
                textAlign: $('#horizontal-align').val(),
                verticalAlign: $('#vertical-align').val(),
                borderRadius: $('#border-radius').val()
            });

            updateCSSOutput();
            addToUndoStack();
            debug("Styles applied");
        } else {
            debug("No element selected for applying styles");
        }
    });

    $('#element-custom-name').on('change', function() {
        if (selectedElement) {
            updateElementName(selectedElement, $(this).val());
        }
    });

    $('#save-layout').on('click', function() {
        debug("Save layout clicked");
        const layout = $('#layout-preview').html();
        const css = $('#css-output').text();
        const layoutName = prompt("Enter a name for this layout:", "My Layout");
        
        if (layoutName) {
            $.ajax({
                url: '../php/save_layout.php',
                method: 'POST',
                data: { layout_name: layoutName, layout: layout, css: css },
                success: function(response) {
                    alert('Layout saved successfully!');
                    debug("Layout saved");
                },
                error: function() {
                    alert('Error saving layout.');
                    debug("Error saving layout");
                }
            });
        }
    });

    $('#load-layout').on('click', function() {
        debug("Load layout clicked");
        $.ajax({
            url: '../php/load_layout.php',
            method: 'GET',
            success: function(response) {
                const data = JSON.parse(response);
                $('#layout-preview').html(data.layout_html);
                $('#css-output').text(data.layout_css);
                reattachEvents();
                debug("Layout loaded");
            },
            error: function() {
                alert('Error loading layout.');
                debug("Error loading layout");
            }
        });
    });

    $('#layout-preview').on('click', function(e) {
        if ($(e.target).is('#layout-preview')) {
            selectedElement = null;
            $('.selected').removeClass('selected');
            clearElementEditor();
            debug("No element selected");
        }
    });

    // Initialize
    $('#element-editor').show();
    debug("Attempting to show element editor");
    
    // Check if element editor is visible
    if ($('#element-editor').is(':visible')) {
        debug("Element editor is visible on page load");
    } else {
        debug("ERROR: Element editor is hidden on page load");
    }

    // Check element editor's CSS properties
    let editorCSS = $('#element-editor').css(['display', 'visibility', 'opacity']);
    debug(`Element editor CSS - Display: ${editorCSS.display}, Visibility: ${editorCSS.visibility}, Opacity: ${editorCSS.opacity}`);

    clearElementEditor();
    debug("Setup complete");
    // Force element editor to be visible
$('#element-editor').css({
    'display': 'block',
    'visibility': 'visible',
    'opacity': '1'
});

debug("Forced element editor to be visible");

// Check element editor's position and size
let editorRect = $('#element-editor')[0].getBoundingClientRect();
debug(`Element editor position - Top: ${editorRect.top}, Left: ${editorRect.left}, Width: ${editorRect.width}, Height: ${editorRect.height}`);

// Check if element editor is in the viewport
let isInViewport = (
    editorRect.top >= 0 &&
    editorRect.left >= 0 &&
    editorRect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    editorRect.right <= (window.innerWidth || document.documentElement.clientWidth)
);
debug(`Element editor is ${isInViewport ? 'in' : 'not in'} the viewport`);
});
