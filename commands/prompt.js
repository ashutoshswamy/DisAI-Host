const config = require("../config.json");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const discord = require("discord.js");

module.exports = {
  data: new discord.SlashCommandBuilder()
    .setName("prompt")
    .setDescription("Enter your prompt")
    .addStringOption((option) =>
      option.setName("prompt").setDescription("Prompt here").setRequired(true)
    ),
  /**
   * @param {discord.Client} client
   * @param {discord.CommandInteraction} interaction
   */
  async execute(client, interaction) {
    const prompt = interaction.options.getString("prompt");

    await interaction.deferReply();

    try {
      const genAI = new GoogleGenerativeAI(config.gemini_api_key);

      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      const maxContentLength = 2000;

      if (text.length <= maxContentLength) {
        const embed1 = new discord.EmbedBuilder()
          .setColor("Blurple")
          .setTitle(`Prompt: ${prompt}`)
          .setDescription(text)
          .setFooter({
            text: "Data extracted using Gemini API",
          });
        await interaction.editReply({ embeds: [embed1] });
      } else {
        const firstChunk = text.slice(
          0,
          maxContentLength - `Prompt: ${prompt}`.length
        );
        const embed1 = new discord.EmbedBuilder()
          .setColor("Blurple")
          .setTitle(`Prompt: ${prompt}`)
          .setDescription(firstChunk);
        await interaction.editReply({ embeds: [embed1] });

        let remainingText = text.slice(firstChunk.length);
        while (remainingText.length > 0) {
          const chunk = remainingText.slice(0, maxContentLength);
          remainingText = remainingText.slice(maxContentLength);
          const embed2 = new discord.EmbedBuilder()
            .setColor("Blurple")
            .setDescription(chunk)
            .setFooter({
              text: "This is the follow up of the above embed\nData extracted using Gemini API",
            });
          await interaction.followUp({ embeds: [embed2] });
        }
      }
    } catch (err) {
      console.log(err);

      await interaction.editReply({
        content: "An error occurred. Please try again later.",
      });
    }
  },
};
