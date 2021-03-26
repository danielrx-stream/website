/* global $ JSZip Pickr svgAsPngUri saveAs */

type PickrCol = string | {toHEXA(): string[]} | undefined;

let pickerColour: PickrCol;
let pickr: any;
let lastLayerColour: PickrCol;
// !------------------------------------------------------------------------------------------


const doctype = '<?xml version="1.0" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd" [<!ENTITY nbsp "&#160;">]>';

const reEncode = (data) => decodeURIComponent(encodeURIComponent(data).replace(/%([0-9A-F]{2})/g, (match, p1) => { const c = String.fromCharCode(`0x${p1}`); return c === '%' ? '%25' : c; }));

const prepareSvg = (el, scale: number) => {
    let clone = el.cloneNode(true);

    clone.setAttribute('width', 112 * scale);
    clone.setAttribute('height', 112 * scale);

    const validStyle = (sheet: CSSStyleSheet) => (sheet.href?.endsWith('svg-style.css')) || (sheet.href === null);
    const validRule = (rule: CSSStyleRule) => 'style' in rule && el.querySelector(rule.selectorText);
    const sheetToString = (sheet: CSSStyleSheet) => Array.from(sheet.cssRules).filter(validRule).map((rule) => `${rule.selectorText}{${rule.style.cssText}}\n`).join('\n')
    const css = Array.from(document.styleSheets).filter(validStyle).map(sheetToString).join('\n');

    const style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.innerHTML = `<![CDATA[\n${css}\n]]>`;

    const defs = document.createElement('defs');
    defs.appendChild(style);
    clone.insertBefore(defs, clone.firstChild);

    const outer = document.createElement('div');
    outer.appendChild(clone);
    return outer.innerHTML.replace(/NS\d+:href/gi, 'xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href');
};

const convertToPng = (src: CanvasImageSource, scale: number) => {
    const pixelRatio = window.devicePixelRatio || 1;
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = scale * 112 * pixelRatio;
    canvas.height = scale * 112 * pixelRatio;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.drawImage(src, 0, 0);
    const x = canvas.toDataURL('image/png', 0.8); // <---- time sink
    return x;
}


const svgAsPngUri = (emoteName: string, scale: number): () => Promise<string> => {
    const el = document.getElementById(showEmote(emoteName)!.attr('id')!);
    const src = prepareSvg(el, scale);
    return () => {
        return new Promise((resolve) => {
            const image = new Image();
            image.onload = () => resolve(convertToPng(image, scale));
            image.src = `data:image/svg+xml;base64,${window.btoa(reEncode(doctype+src))}`;
        })
    };
};
// !------------------------------------------------------------------------------------------


const titleCase = (s: string) => s[0]!.toUpperCase() + s.slice(1);

const getLayerName = () => $('#layer-name-button').text().toLowerCase();
const getEmoteName = (forceEmoteName?: string) => (forceEmoteName || $('#emote-name').text()).toLowerCase();
const getSVGOfEmote = (emoteName: string) => $(`[id^="variant-${emoteName}"]`).parents('svg');

const getLayerColour = (forceColour?: string) => $(`[id$="-svg"]:visible .${forceColour || getLayerName()}`).css('fill');

const getEmoteNames = (): [string, ...string[]] => [...new Set($('[id^="variant-"]').map((_, e) => $(e).attr('id')!.replace('variant-', '').replace(/--inject-.*/, '')))] as [string, ...string[]];

const getLayers = (emoteName: string): [string, ...string[]] => {
    const layers = new Set();
    getSVGOfEmote(emoteName).find('.coloured').map((_, e) => {
        const classes = $(e).attr('class')!.split(/\s+/).filter((x) => x !== 'coloured') as [string, ...string[]];
        layers.add(classes[0]);
    });
    return [...layers] as [string, ...string[]];
};

const getHairTypes = (emoteName: string): [string, ...string[]] => {
    return ['none', ...new Set(getSVGOfEmote(emoteName).find(`[id*="${emoteName}"] [id^="core-hair-"]`).map((_, e) => $(e).attr('id')!.replace(/--inject-.*/, '').replace('core-hair-', '')))];
};


const setupOptions = (container: string, options: [string, ...string[]], f = (_?: any) => {}) => {
    $(`#${container} li`).remove();
    const [first] = options;
    $(`#${container}-button`).text(titleCase(first));
    for(const option of options) {
        $(`#${container}`).append(`<li><button id="${container}-${option}-btn" class="dropdown-item" type="button">${titleCase(option)}</button></li>`);
        $(`#${container}-${option}-btn`).on('click', () => {
            $(`#${container}-button`).text(titleCase(option));
            (f || (() => {}))(option);
        })
    }
};

const setLayerColour = (forceColour: string) => pickr.setColor(getLayerColour(forceColour));

const svgList = ['ge', 'peepowtf', 'peeporecon', 'hypers', 'ppl', 'monkas', 'dankthink', 'peeposhy'];

let pageNumber = 1;

const showHair = (hairType?: string) => {
    $('[id^="core-hair"]').hide();
    $(`[id^="core-hair-${hairType}"]`).show();
};

const showEmote = (emoteNameForce: string): any => {
    const emoteName = getEmoteName(emoteNameForce);
    if(emoteName) {
        $('[id^="variant"]').hide();
        $('[id^="variant"]').parents('svg').hide();
        showHair();
        $(`[id^="variant-${emoteName}"]`).show();
        const svg = getSVGOfEmote(emoteName);
        svg.show();
        return svg;
    }
};

// !------------------------------------------------------------------------------------------
const updatePage = () => {
    $('[id^="page-btn-"]').show();
    if(pageNumber >= $('#emote-grid').find('img').length / 16) {
        $('#page-btn-forward').hide();
    }
    if(pageNumber <= 1) { $('#page-btn-back').hide(); }
    $('#page-number').text(`Page ${pageNumber}`);
};

const showOverviewPage = (page: number) => {
    updatePage();
    $('#emote-grid img').hide();
    $('#emote-grid img').slice((page - 1) * 16, page * 16).show();
};

const goBackPage = () => showOverviewPage(--pageNumber);
const goForwardPage = () => showOverviewPage(++pageNumber);


const showOverview = async() => {
    await addAllToOverview();
    showOverviewPage(pageNumber);
    $('.overview').css({'z-index': 2});
};

const hideOverview = (emoteName: string) => () => {
    $('#emote-name').text(titleCase(emoteName));
    setEmoteLayers(emoteName); // ? <-------------------
    $('.overview').css({'z-index': -2});
};

const addAllToOverview = async() => {
    console.time('AddAll');
    const oldEmote = getEmoteName();
    $('#emote-wrapper').hide();
    $('#emote-grid img').remove();
    const emoteCalls = [];
    const emoteNames = getEmoteNames();
    for(const emoteName of emoteNames) {
        $('#emote-grid').append(`<img width="140px" src="" id="emote-overview-${emoteName}" style="display:none" class="breathing"/>`);
        $(`#emote-overview-${emoteName}`).on('click', hideOverview(emoteName));
        emoteCalls.push(svgAsPngUri(emoteName, 15));
    }
    showEmote(oldEmote);
    $('#emote-wrapper').show();
    await Promise.all((emoteCalls.map((f, i) => f().then((uri: string) => $(`#emote-overview-${emoteNames[i]}`).attr('src', uri))))).then(() => { console.timeEnd('AddAll'); });
};

// !------------------------------------------------------------------------------------------

const setEmoteLayers = (emoteNameForce?: string) => {
    const emoteName = getEmoteName(emoteNameForce);
    showEmote(emoteName);
    pickerColour = undefined;
    setupOptions('layer-name', getLayers(emoteName), setLayerColour);
    setupOptions('hair-type', getHairTypes(emoteName), showHair);
    setupOptions('emote-scale', ['all', 'bttv', 'twitch']);
    setTimeout(setLayerColour, 100);
};

const colourLayerIn = () => {
    if(typeof pickerColour === 'undefined') { return; }
    $(`svg .${getLayerName()}`).css({fill: `#${typeof pickerColour === 'string' ? pickerColour : pickerColour.toHEXA().join('')}`});
};

const getEmoteSizes = () => {
    switch($('#emote-scale-button').text().toLowerCase()) {
        case 'all': return [112, 4096];
        case 'twitch': return [4096];
        case 'bttv': return [112];
        default: return [];
    }
};


const downloadEmotes = async() => {
    const emoteSizes = getEmoteSizes();
    const zip = new (window as any).JSZip();
    const oldEmote = getEmoteName();
    const emoteNames = getEmoteNames();
    $('#emote-wrapper').hide();
    let j = 0;
    for(const emoteName of emoteNames) {
        for(const size of emoteSizes) {
            const uri = await svgAsPngUri(emoteName, size/112)();
            const idx = uri.indexOf('base64,') + 'base64,'.length;
            const content = uri.substring(idx);
            zip.file(`${size}/${emoteName}.png`, content, {base64: true});
        }
        j++;
        $('#progress-image-cover').css({height: `${200 - (200 * (j / emoteNames.length))}px`});
    }
    showEmote(oldEmote);
    $('#emote-wrapper').show();
    zip.generateAsync({type: 'blob'}).then((content: Blob) => {
        (window as any).saveAs(content, 'emotes.zip');
    });
};

window.onload = () => {
    const el = document.querySelector('#picker');
    pickr = (window as any).Pickr.create({
        comparison: true,
        components: {hue: true, interaction: {input: true, save: true}},
        el,
        theme: 'classic'
    });
    pickr.on('init', () => { setTimeout(setLayerColour, 1000); });
    pickr.on('hide', () => { pickerColour = lastLayerColour; pickr.setColor(lastLayerColour); lastLayerColour = undefined; });
    pickr.on('show', () => { lastLayerColour = getLayerColour(); });
    pickr.on('save', (color: any) => { lastLayerColour = `#${color.toHEXA().join('')}`; pickerColour = undefined; });
    pickr.on('change', (color: PickrCol) => { pickerColour = color; });

    const img = (name: string) => `<img id="${name}-svg" src="/assets/svg/${name}.svg" onload="SVGInject(this)" style="display:none" height="50vh" width="auto" />`;
    $('#emote-wrapper').prepend(...svgList.map(img));

    const init = () => {
        $('#emote-name').text(titleCase(getEmoteNames()[0]));
        setEmoteLayers();
        setTimeout(() => $('#overview-link').click(), 1000);
    };

    setInterval(colourLayerIn, 100);
    setTimeout(init, 1000);

    $('#overview-link').on('click', showOverview);
    $('#hair-type').on('change', () => showHair());
    $('#download-link').on('click', downloadEmotes);
    $('#page-forward').on('click', goForwardPage);
    $('#page-back').on('click', goBackPage);
};
