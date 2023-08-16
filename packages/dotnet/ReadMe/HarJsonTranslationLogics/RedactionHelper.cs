using System.Linq;
using Microsoft.Extensions.Primitives;
using ReadMe.HarJsonObjectModels;

namespace ReadMe.HarJsonTranslationLogics
{
    using System;
    using System.Collections.Generic;
    using Microsoft.AspNetCore.Http;
    using Newtonsoft.Json.Linq;

    public static class RedactionHelper
    {
        public static List<Headers> RedactHeaderDictionary(
            IHeaderDictionary headerDictionary,
            List<string> allowList = null,
            List<string> denyList = null)
        {
            var redactedHeaders = new List<Headers>();

            foreach (var keyValuePair in headerDictionary)
            {
                var key = keyValuePair.Key;
                var value = keyValuePair.Value;

                if (ShouldRedactKey(key, allowList, denyList))
                {
                    var redactedValue = RedactValue(value);
                    redactedHeaders.Add(new Headers { name = key, value = redactedValue });
                }
                else
                {
                    redactedHeaders.Add(new Headers { name = key, value = value });
                }
            }

            return redactedHeaders;
        }

        public static List<Params> RedactFormCollection(
            IFormCollection formCollection,
            List<string> allowList = null,
            List<string> denyList = null)
        {
            var redactedParams = new List<Params>();

            foreach (var key in formCollection.Keys)
            {
                if (ShouldRedactKey(key, allowList, denyList))
                {
                    var redactedValue = RedactValue(formCollection[key]);
                    redactedParams.Add(new Params { name = key, value = redactedValue });
                }
                else
                {
                    redactedParams.Add(new Params { name = key, value = formCollection[key] });
                }
            }

            return redactedParams;
        }

        public static bool IsApplicationJson(string mimeType)
        {
            if (string.IsNullOrEmpty(mimeType))
            {
                return false;
            }

            string[] jsonMimeTypes = { "application/json", "application/x-json", "text/json", "text/x-json" };

            return jsonMimeTypes.Contains(mimeType) ||
                   mimeType.IndexOf("+json", StringComparison.OrdinalIgnoreCase) != -1;
        }

        public static JObject RedactJson(
            JObject jsonObject,
            List<string> allowList = null,
            List<string> denyList = null)
        {
            var redactedObject = RedactJsonRecursive(jsonObject, allowList, denyList);
            return redactedObject;
        }

        private static JObject RedactJsonRecursive(JObject obj, List<string> allowList, List<string> denyList)
        {
            var redactedObject = new JObject();

            foreach (var property in obj.Properties())
            {
                if (ShouldRedactKey(property.Name, allowList, denyList))
                {
                    var redactedValue = RedactToken(property.Value, allowList, denyList);
                    redactedObject.Add(property.Name, redactedValue);
                }
                else
                {
                    redactedObject.Add(property.Name, property.Value);
                }
            }

            return redactedObject;
        }

        private static bool ShouldRedactKey(string key, List<string> allowList, List<string> denyList)
        {
            if (denyList != null &&
                denyList.Exists(item => string.Equals(item, key, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            if (allowList != null &&
                !allowList.Exists(item => string.Equals(item, key, StringComparison.OrdinalIgnoreCase)))
            {
                return true;
            }

            return false;
        }

        private static JToken RedactToken(JToken token, List<string> allowList, List<string> denyList)
        {
            if (token.Type == JTokenType.Object)
            {
                return RedactJsonRecursive(token.Value<JObject>(), allowList, denyList);
            }

            if (token.Type == JTokenType.String)
            {
                return new JValue(RedactValue(token.Value<string>()));
            }

            return "[REDACTED]"; // Return as-is for other token types
        }

        private static string RedactValue<T>(T value)
        {
            if (value is string || value is StringValues)
            {
                string strValue = value.ToString(); // Convert value to string
                return $"[REDACTED {strValue.Length}]";
            }
            else
            {
                return "[REDACTED]";
            }
        }
    }
}