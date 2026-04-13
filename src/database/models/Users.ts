import { DataTypes, Model, Sequelize } from 'sequelize';
import { UsersAttributes } from '@app/types/index.js';


class UsersEntity extends Model<UsersAttributes> {

  public static initialize(sequelize: Sequelize) {
    this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          primaryKey: true,
          autoIncrement: true,
        },
        name: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        picture: {
          type: DataTypes.STRING,
          allowNull: true,
        },
        email: {
          type: DataTypes.STRING(64),
          allowNull: false,
        },
        phone: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        password: {
          type: DataTypes.STRING,
          allowNull: false,
        },
        emailVerified: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        isAffiliated: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        percentage: {
          type: DataTypes.DECIMAL,
          allowNull: false,
          defaultValue: 0,
        },
        credits: {
          type: DataTypes.DECIMAL,
          allowNull: false,
          defaultValue: 0,
        },
        language: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: "pt-BR",
        },
        timezone: {
          type: DataTypes.STRING,
          allowNull: true,
          defaultValue: "America/Cuiaba",
        },
        notificationEmailEnabled: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        notificationUpdateSystem: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        notificationPromotions: {
          type: DataTypes.BOOLEAN,
          allowNull: true,
          defaultValue: true,
        },
        permission: {
          type: DataTypes.INTEGER,
          allowNull: false,
          defaultValue: 1, // Default to USER
        },

      },
      {
        sequelize,
        tableName: 'users',
        timestamps: true,
        underscored: true,
      }
    );
  }
}

export { UsersEntity };
