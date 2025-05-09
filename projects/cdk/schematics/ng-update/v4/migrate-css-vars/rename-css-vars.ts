/// <reference lib="es2021" />
import {getSourceFiles} from 'ng-morph';

import {ALL_FILES} from '../../../constants';
import {
    DEPRECATE_VARS_WITH_COMMENT,
    DEPRECATED_NUMERIC_VARS,
    DEPRECATED_VARS,
    NIGHT_VAR_COMMENT,
} from './palette';

export function renameCssVars(pattern = ALL_FILES): void {
    const sourceFiles = getSourceFiles(pattern);

    sourceFiles.forEach((file) => {
        let text = file.getFullText();

        // leave comments
        if (!file.getFilePath().endsWith('html')) {
            DEPRECATE_VARS_WITH_COMMENT.forEach((variable) => {
                const wordRegex = new RegExp(`(^|\\n)(?=[^\\n]*${variable}\\b)`, 'g');

                text = text.replaceAll(wordRegex, `$1// ${NIGHT_VAR_COMMENT}\n`);
            });
        }

        const placeholders: Record<string, string> = {};

        Object.keys(DEPRECATED_VARS).forEach((key, index) => {
            placeholders[key] = `__PLACEHOLDER_${index}__`;
        });

        Object.entries(DEPRECATED_VARS)
            .sort(([prev], [next]) => (prev.length < next.length ? 1 : -1))
            .map(([from, to]) => ({
                from: new RegExp(`${from}`, 'g'),
                to,
            }))
            .forEach(({from}) => {
                text = text.replace(from, (matched) => placeholders[matched] ?? '');
            });

        const placeholderPattern = new RegExp(Object.values(placeholders).join('|'), 'g');

        text = text.replaceAll(placeholderPattern, (matched) => {
            const originalKey = Object.keys(placeholders).find(
                (key) => placeholders[key] === matched,
            );

            return DEPRECATED_VARS[originalKey as keyof typeof DEPRECATED_VARS];
        });

        Object.entries(DEPRECATED_NUMERIC_VARS)
            .map(([from, to]) => ({
                from: new RegExp(`${from}`, 'g'),
                to,
            }))
            .forEach(({from, to}) => {
                text = text.replaceAll(from, to);
            });

        file.replaceWithText(text);
    });
}
