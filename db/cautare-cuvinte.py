import rowordnet as rwn
from rowordnet import Synset
import random
import json

wn = rwn.RoWordNet()
cuvinte = []

# Setari
pos_to_search = [Synset.Pos.NOUN, Synset.Pos.VERB, Synset.Pos.ADVERB, Synset.Pos.ADJECTIVE]
word_lenght = 5

for pos in pos_to_search:
    for synset_id in wn.synsets(pos=pos):
        literals = wn.synset(synset_id).literals
        if literals:
            for literal in literals:
                if (len(literal) != word_lenght
                    or "_" in literal
                    or " " in literal
                    or ("\"" + literal + "\"") in cuvinte
                    or literal[0].isupper()):
                        continue
                cuvinte.append("\"" + literal + "\"")

random.shuffle(cuvinte)

f = open("cuvinte.js", "w", encoding="utf-8")
f.write("const cuvinte = [" + ",".join(cuvinte) + "]")
f.close()

print("Done! Found " + str(len(cuvinte)))