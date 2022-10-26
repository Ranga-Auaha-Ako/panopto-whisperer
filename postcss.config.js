import tailwind from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import tailwindNesting from '@tailwindcss/nesting';
import PostCSSImport from 'postcss-import';
import postcssNesting from 'postcss-nesting';
import postcssFor from 'postcss-for';

export default {
	plugins: [
		//Some plugins, like tailwindcss/nesting, need to run before Tailwind,
		PostCSSImport(),
		postcssFor(),
		tailwindNesting(postcssNesting),
		tailwind(),
		//But others, like autoprefixer, need to run after,
		autoprefixer
	]
};
