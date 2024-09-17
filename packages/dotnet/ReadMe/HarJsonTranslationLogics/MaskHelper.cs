using System;
using System.Security.Cryptography;
using System.Text;

public static class MaskHelper
{
    public static string Mask(string data)
    {
        using (SHA512 sha512 = SHA512.Create())
        {
            byte[] hashBytes = sha512.ComputeHash(Encoding.UTF8.GetBytes(data));
            string base64Hash = Convert.ToBase64String(hashBytes);
            string opts = data.Length >= 4 ? data.Substring(data.Length - 4) : data;
            return $"sha512-{base64Hash}?{opts}";
        }
    }
}
