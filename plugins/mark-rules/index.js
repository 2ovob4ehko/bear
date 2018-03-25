module.exports = function(md, options) {

    function renderUnder_open(source, displayMode){
        return '<u>';
    }
    function renderUnder_close(source, displayMode){
        return '</u>';
    }

    function parseBlockLine(state, startLine, endLine, silent){
        var ch, level, tmp,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

        if (pos >= max) { return false; }

        ch  = state.src.charCodeAt(pos);

        if (ch !== 0x23/* # */ || pos >= max) { return false; }

        // count heading level
        level = 1;
        ch = state.src.charCodeAt(++pos);
        while (ch === 0x23/* # */ && pos < max && level <= 6) {
            level++;
            ch = state.src.charCodeAt(++pos);
        }

        if (level > 6 || (pos < max && ch !== 0x20/* space */)) { return false; }

        if (silent) { return true; }

        // Let's cut tails like '    ###  ' from the end of string

        max = state.skipCharsBack(max, 0x20, pos); // space
        tmp = state.skipCharsBack(max, 0x23, pos); // #
        if (tmp > pos && state.src.charCodeAt(tmp - 1) === 0x20/* space */) {
            max = tmp;
        }

        state.line = startLine + 1;

        state.tokens.push({
            type: 'heading_open',
            hLevel: level,
            lines: [ startLine, state.line ],
            level: state.level
        });

        // only if header is not empty
        if (pos < max) {
            state.tokens.push({
                type: 'inline',
                content: state.src.slice(pos, max).trim(),
                level: state.level + 1,
                lines: [ startLine, state.line ],
                children: []
            });
        }
        console.log(level);
        state.tokens.push({ type: 'heading_close', hLevel: level, level: state.level });

        return true;
    }

    function parseInlineUnder(state, silent) {
        var startCount,
        count,
        found,
        oldCount,
        newCount,
        stack,
        res,
        max = state.posMax,
        start = state.pos,
        marker = state.src.charCodeAt(start);

        if (marker !== 0x5F/* _ */) { return false; }
        if (silent) { return false; } // don't run any pairs in validation mode

        res = scanDelims(state, start, 0x5F);
        startCount = res.delims;
        if (!res.can_open) {
            state.pos += startCount;
            if (!silent) { state.pending += state.src.slice(start, state.pos); }
            return true;
        }

        if (state.level >= state.options.maxNesting) { return false; }

        state.pos = start + startCount;
        stack = [ startCount ];

        while (state.pos < max) {
            if (state.src.charCodeAt(state.pos) === marker) {
                res = scanDelims(state, state.pos, 0x5F);
                count = res.delims;
                if (res.can_close) {
                    oldCount = stack.pop();
                    newCount = count;

                    while (oldCount !== newCount) {
                        if (newCount < oldCount) {
                            stack.push(oldCount - newCount);
                            break;
                        }

                        // assert(newCount > oldCount)
                        newCount -= oldCount;

                        if (stack.length === 0) { break; }
                        state.pos += oldCount;
                        oldCount = stack.pop();
                    }

                    if (stack.length === 0) {
                        startCount = oldCount;
                        found = true;
                        break;
                    }
                    state.pos += count;
                    continue;
                }

                if (res.can_open) { stack.push(count); }
                state.pos += count;
                continue;
            }

            state.parser.skipToken(state);
        }

        if (!found) {
            // parser failed to find ending tag, so it's not valid emphasis
            state.pos = start;
            return false;
        }

        // found!
        state.posMax = state.pos;
        state.pos = start + startCount;

        if (!silent) {
            if (startCount === 1) {
                state.push({ type: 'under_open', level: state.level++ });
            }
            state.parser.tokenize(state);

            if (startCount === 1) {
                state.push({ type: 'under_close', level: --state.level });
            }
        }

        state.pos = state.posMax + startCount;
        state.posMax = max;
        return true;
    }

    function renderBold_open(source, displayMode){
        return '<b>';
    }
    function renderBold_close(source, displayMode){
        return '</b>';
    }

    function parseInlineBold(state, silent) {
        var startCount,
        count,
        found,
        oldCount,
        newCount,
        stack,
        res,
        max = state.posMax,
        start = state.pos,
        marker = state.src.charCodeAt(start);

        if (marker !== 0x2A/* * */) { return false; }
        if (silent) { return false; } // don't run any pairs in validation mode

        res = scanDelims(state, start, 0x2A);
        startCount = res.delims;
        if (!res.can_open) {
            state.pos += startCount;
            if (!silent) { state.pending += state.src.slice(start, state.pos); }
            return true;
        }

        if (state.level >= state.options.maxNesting) { return false; }

        state.pos = start + startCount;
        stack = [ startCount ];

        while (state.pos < max) {
            if (state.src.charCodeAt(state.pos) === marker) {
                res = scanDelims(state, state.pos, 0x2A);
                count = res.delims;
                if (res.can_close) {
                    oldCount = stack.pop();
                    newCount = count;

                    while (oldCount !== newCount) {
                        if (newCount < oldCount) {
                            stack.push(oldCount - newCount);
                            break;
                        }

                        // assert(newCount > oldCount)
                        newCount -= oldCount;

                        if (stack.length === 0) { break; }
                        state.pos += oldCount;
                        oldCount = stack.pop();
                    }

                    if (stack.length === 0) {
                        startCount = oldCount;
                        found = true;
                        break;
                    }
                    state.pos += count;
                    continue;
                }

                if (res.can_open) { stack.push(count); }
                state.pos += count;
                continue;
            }

            state.parser.skipToken(state);
        }

        if (!found) {
            // parser failed to find ending tag, so it's not valid emphasis
            state.pos = start;
            return false;
        }

        // found!
        state.posMax = state.pos;
        state.pos = start + startCount;

        if (!silent) {
            if (startCount === 1) {
                state.push({ type: 'bold_open', level: state.level++ });
            }
            state.parser.tokenize(state);

            if (startCount === 1) {
                state.push({ type: 'bold_close', level: --state.level });
            }
        }

        state.pos = state.posMax + startCount;
        state.posMax = max;
        return true;
    }

    // parse sequence of emphasis markers,
    // "start" should point at a valid marker
    function scanDelims(state, start, sign) {
        var pos = start, lastChar, nextChar, count,
        can_open = true,
        can_close = true,
        max = state.posMax,
        marker = state.src.charCodeAt(start);

        lastChar = start > 0 ? state.src.charCodeAt(start - 1) : -1;

        while (pos < max && state.src.charCodeAt(pos) === marker) { pos++; }
        if (pos >= max) { can_open = false; }
        count = pos - start;

        if (count >= 4) {
            // sequence of four or more unescaped markers can't start/end an emphasis
            can_open = can_close = false;
        } else {
            nextChar = pos < max ? state.src.charCodeAt(pos) : -1;

            // check whitespace conditions
            if (nextChar === 0x20 || nextChar === 0x0A) { can_open = false; }
            if (lastChar === 0x20 || lastChar === 0x0A) { can_close = false; }

            if (marker === sign /* _ */) {
                // check if we aren't inside the word
                if (isAlphaNum(lastChar)) { can_open = false; }
                if (isAlphaNum(nextChar)) { can_close = false; }
            }
        }

        return {
            can_open: can_open,
            can_close: can_close,
            delims: count
        };
    }
    function isAlphaNum(code) {
        return (code >= 0x30 /* 0 */ && code <= 0x39 /* 9 */) ||
        (code >= 0x41 /* A */ && code <= 0x5A /* Z */) ||
        (code >= 0x61 /* a */ && code <= 0x7A /* z */);
    }

    md.renderer.rules.heading_open = function(tokens, idx /*, options, env */) {
      return '<div class="line"><div class="sign">H<span class="small">' + tokens[idx].hLevel + '</span></div><div class="content"><h' + tokens[idx].hLevel + '>';
    };
    md.renderer.rules.heading_close = function(tokens, idx /*, options, env */) {
      return '</h' + tokens[idx].hLevel + '></div></div>\n';
    };
    md.renderer.rules.paragraph_open = function(tokens, idx /*, options, env */) {
      return tokens[idx].tight ? '' : '<div class="line"><div class="sign"></div><div class="content"><p>';
    };
    md.renderer.rules.paragraph_close = function(tokens, idx /*, options, env */) {
      var addBreak = !(tokens[idx].tight && idx && tokens[idx - 1].type === 'inline' && !tokens[idx - 1].content);
      return (tokens[idx].tight ? '' : '</p></div></div>') + (addBreak ? md.renderer.rules.getBreak(tokens, idx) : '');
    };

    md.inline.ruler.before('text','under', parseInlineUnder, options);
    md.renderer.rules.under_open = function(tokens, idx) {
        return renderUnder_open(tokens[idx].content, tokens[idx].block);
    };
    md.renderer.rules.under_close = function(tokens, idx) {
        return renderUnder_close(tokens[idx].content, tokens[idx].block);
    };

    md.inline.ruler.before('text','bold', parseInlineBold, options);
    md.renderer.rules.bold_open = function(tokens, idx) {
        return renderBold_open(tokens[idx].content, tokens[idx].block);
    };
    md.renderer.rules.bold_close = function(tokens, idx) {
        return renderBold_close(tokens[idx].content, tokens[idx].block);
    };

};