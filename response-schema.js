/* Provider-enforced JSON structure, with local validation as a second boundary. */
(function(root){
  const object=properties=>({type:'object',properties,additionalProperties:false});
  const s={type:'string'}, id={type:'integer'};
  root.MomentumResponseFormat={type:'json_schema',schema:{...object({
    reply:s,phase:{type:'string',enum:['opening','foundation','discovery','direction','open']},
    candidates:{type:'array',items:object({id,why:s})},
    confirmed:{type:'array',items:object({id,level:{type:'integer'},evidence:s})},
    costs:{type:'array',items:s},open:{type:'array',items:s},
    proposals:{type:'array',items:object({title:s,why:s})},
    concern:{type:'boolean'},ack:{type:'boolean'},shift:{type:'boolean'},document:{type:'boolean'}
  }),required:['reply']}};
})(window);
