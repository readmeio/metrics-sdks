import unittest
import util

class UtilTestCase(unittest.TestCase):
    def testExcludeKeys(self):
        #dict is None
        self.assertRaises(AttributeError, util.util_exclude_keys(None, ["key1", "key2"]))
        #dict is Empty
        tester = util.util_exclude_keys({}, ["key1", "key2"])
        self.assertDictEqual(tester, {})
        #key is None
        self.assertRaises(TypeError, util.util_exclude_keys({"key1": "A", "key2": "B"}, None))
        #key is Empty
        tester = util.util_exclude_keys({"key1": "A", "key2": "B"}, [])
        self.assertDictEqual(tester, {"key1": "A", "key2": "B"})
        #keys all not in dict
        tester = util.util_exclude_keys({"key1": "A", "key2": "B"}, ["key3", "key4"])
        self.assertDictEqual(tester, {"key1": "A", "key2": "B"})
        #keys is all in dict
        tester = util.util_exclude_keys({"key1": "A", "key2": "B"}, ["key1", "key2"])
        self.assertDictEqual(tester, {})
        #some keys in dict
        tester = util.util_exclude_keys({"key1": "A", "key2": "B"}, ["key2", "key3"])
        self.assertDictEqual(tester, {"key1": "A"})

    def testFilterKeys(self):
        #dict is None
        self.assertRaises(TypeError, util.util_filter_keys(None, ["key1", "key2"]))
        #dict is Empty
        tester = util.util_filter_keys({}, ["key1", "key2"])
        self.assertDictEqual(tester, {})
        #key is None
        self.assertRaises(TypeError, util.util_filter_keys({"key1": "A", "key2": "B"}, None))
        #key is Empty
        tester = util.util_filter_keys({"key1": "A", "key2": "B"}, [])
        self.assertDictEqual(tester, {})
        #keys all not in dict
        tester = util.util_filter_keys({"key1": "A", "key2": "B"}, ["key3", "key4"])
        self.assertDictEqual(tester, {})
        #keys is all in dict
        tester = util.util_filter_keys({"key1": "A", "key2": "B"}, ["key1", "key2"])
        self.assertDictEqual(tester, {"key1": "A", "key2": "B"})
        #some keys in dict
        tester = util.util_filter_keys({"key1": "A", "key2": "B"}, ["key2", "key3"])
        self.assertDictEqual(tester, {"key2": "B"})


if __name__ == '__main__':
    unittest.main()