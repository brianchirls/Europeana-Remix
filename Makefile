#
# css/js minification/compression makefile
#

JS_DIR := ./client/js
PLUGIN_DIR := $(JS_DIR)/plugins
CSS_DIR := ./client/css
TOOLS_DIR := ./tools

SCRIPT_MIN := $(JS_DIR)/remix.min.js

JS_TARGETS := \
	$(PLUGIN_DIR)/loaderator.js \
	$(PLUGIN_DIR)/popcorn.js \
	$(PLUGIN_DIR)/popcorn.code.js \
	$(PLUGIN_DIR)/popcorn.europeana.js \
	$(PLUGIN_DIR)/popcorn.flickr.js \
	$(PLUGIN_DIR)/popcorn.googlemap.js \
	$(PLUGIN_DIR)/popcorn.html-eu.js \
	$(PLUGIN_DIR)/popcorn.image.js \
	$(PLUGIN_DIR)/popcorn.subtitle.js \
	$(PLUGIN_DIR)/popcorn.video-comment.js \
	$(PLUGIN_DIR)/popcorn.wikipedia.js \
	$(PLUGIN_DIR)/popcorn.youtube.js \
	$(PLUGIN_DIR)/popcorn.words.js \
	$(JS_DIR)/script.js

CSS_TARGETS := $(CSS_DIR)/style.css
CLEANUP =

compile = java -jar $(TOOLS_DIR)/closure/compiler.jar \
                    $(shell for js in $(JS_TARGETS) ; do echo --js $$js ; done) \
	                  --compilation_level SIMPLE_OPTIMIZATIONS \
	                  --js_output_file $(1)

.DEFAULT_GOAL := all

all: js css

# css
# ---

css:
#	@@echo: "Minifying CSS"
	java -jar $(TOOLS_DIR)/yuicompressor-2.4.6.jar -o $(CSS_DIR)/style.min.css $(CSS_DIR)/style.css

# javascript
# ----------

js:
#	@@echo: "Building $(SCRIPT_MIN)"
	@@$(call compile,$(SCRIPT_MIN))

clean:
	rm -f $(SCRIPT_MIN) $(CSS_DIR)/style.css $(CLEANUP)
